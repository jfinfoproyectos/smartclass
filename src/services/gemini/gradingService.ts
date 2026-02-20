import { getGeminiClient, MODEL_NAME, extractJSON, repairFeedbackText } from "./client";
import { analyzeFile, FileAnalysis } from "./codeAnalysisService";
import { githubService } from "../githubService";

export interface GradingResult {
    grade: number;
    feedback: string;
    apiRequestsCount?: number;
}

/**
 * Finalize submission by consolidating individual file analyses (REDUCE phase)
 */
export async function finalizeSubmission(
    analyses: FileAnalysis[],
    description: string,
    missingFiles: string[],
    userId?: string
): Promise<GradingResult> {
    try {
        const ai = await getGeminiClient(userId);
        const analysesText = JSON.stringify(analyses, null, 2);

        const prompt = `
        Actúa como un evaluador principal. He recibido los análisis individuales de los archivos de un estudiante.
        Tu tarea es consolidar estos análisis y emitir la nota final y retroalimentación.
        
        **REGLAS ESTRICTAS**: 
        1. Evalúa **EXCLUSIVAMENTE** lo que se solicita en la "Rúbrica". NO supongas que faltan características, manejo de errores, frameworks, o funcionalidades adicionales si no fueron explícitamente solicitadas. 
        Penaliza ÚNICAMENTE si no se cumplió algo pedido en la rúbrica.
        2. Al evaluar ejercicios de Java o lenguajes orientados a objetos, **NO penalices** por problemas de dependencias, falta de imports, o clases no definidas en los archivos provistos. Asume que están en el contexto del proyecto. Tampoco evalúes estrictamente la indentación.
        
        **Rúbrica**: "${description}"
        
        **Análisis de Archivos**:
        ${analysesText}
        
        **Archivos Faltantes (CRÍTICO)**: ${missingFiles.join(", ") || "Ninguno"}
        
        **POLÍTICA DE CALIFICACIÓN Y FEEDBACK**:
        1. Si faltan archivos requeridos, penaliza severamente (Nota máxima 2.0 si faltan archivos clave).
        2. Promedia la calidad de los archivos existentes en base ÚNICAMENTE a lo solicitado en la rúbrica. No bajes nota por "falta de extras".
        3. Genera un feedback constructivo y completo. **El contenido de este feedback DEBE estar basado ESTRICTAMENTE en el "Enunciado/Rúbrica" evaluado y los resultados del análisis. No hagas mención ni evalúes aspectos de instrucciones generales que no estén en la rúbrica.**
        
        **SALIDA REQUERIDA (JSON)**:
        {
            "grade": <Nota final 0.0 - 5.0>,
            "feedback": "<Markdown estructurado con tabla de requisitos, fortalezas y debilidades>"
        }
        `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", maxOutputTokens: 8192 }
        });

        const text = result.text;
        if (!text) {
            throw new Error("No response text received from AI");
        }
        const json = extractJSON<GradingResult>(text);

        // Repair feedback
        if (json.feedback) {
            json.feedback = repairFeedbackText(json.feedback);
        }

        return json;
    } catch (error: any) {
        console.error("Gemini API Error (Finalize):", error);

        const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "Error desconocido al evaluar.");
        let errorMessage = "Error al consolidar la evaluación final.";

        if (errorString.includes("SAFETY")) {
            errorMessage = "Evaluación detenida por filtros de seguridad.";
        } else if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            errorMessage = "Has excedido la cuota gratuita de peticiones a la IA de Gemini.";
        } else {
            errorMessage = typeof error.message === 'string' ? error.message : errorMessage;
        }

        throw new Error(errorMessage);
    }
}

/**
 * Grade a complete submission using map-reduce pattern
 */
export async function gradeSubmission(
    description: string,
    repoUrl: string,
    filePaths?: string,
    userId?: string
): Promise<GradingResult> {
    try {
        const repoInfo = githubService.parseGitHubUrl(repoUrl);
        if (!repoInfo || !filePaths) {
            throw new Error("Información de repositorio inválida.");
        }

        // Get GitHub token
        const { getGithubToken } = await import("@/lib/githubTokenHelper");
        const token = await getGithubToken();

        const paths = filePaths.split(',').map(p => p.trim());
        const missingFiles: string[] = [];
        const analyses: FileAnalysis[] = [];

        console.log(`[GradingService] Starting Map-Reduce grading for ${repoUrl}`);

        // MAP STEP: Analyze each file individually, accumulating context
        let accumulatedContext = "";
        let apiRequestsCount = 0;

        for (const path of paths) {
            const content = await githubService.getFileContent(repoInfo.owner, repoInfo.repo, path, token || undefined);
            if (content) {
                console.log(`[GradingService] Analyzing file: ${path}`);

                // Pass accumulated context to analyzeFile (except for the first file where it's empty)
                const analysis = await analyzeFile(path, content, description, repoUrl, userId, accumulatedContext || undefined);
                apiRequestsCount++;
                analyses.push(analysis);

                // Add this file's summary to the accumulated context for the next files
                accumulatedContext += `\n- **${path}**: ${analysis.summary}`;

            } else {
                console.error(`[GradingService] Missing file: ${path}`);
                missingFiles.push(path);
            }
        }

        // REDUCE STEP: Consolidate analyses into final grade
        console.log(`[GradingService] Finalizing submission with ${analyses.length} analyses.`);
        const finalResult = await finalizeSubmission(analyses, description, missingFiles, userId);
        apiRequestsCount++;
        finalResult.apiRequestsCount = apiRequestsCount;

        return finalResult;

    } catch (error: any) {
        console.error("Gemini API Error:", error);

        // Convert error to string for easier pattern matching
        const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "Error desconocido al evaluar.");
        let errorMessage = "Error desconocido al evaluar.";

        if (errorString.includes("SAFETY")) {
            errorMessage = "Evaluación detenida por filtros de seguridad.";
        } else if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            errorMessage = "Has excedido la cuota gratuita de peticiones a la IA de Gemini.";
        } else {
            // Keep the original error if it's string-based, otherwise use a generic message to avoid JSON dumps
            errorMessage = typeof error.message === 'string' ? error.message : errorMessage;
        }

        throw new Error(errorMessage);
    }
}

async function fetchColabContent(url: string): Promise<string | null> {
    let fetchUrl = url;
    // Try to convert Colab/Drive link to export link
    // Matches: colab.research.google.com/drive/ID or drive.google.com/file/d/ID
    const idMatch = url.match(/(?:colab\.research\.google\.com\/drive\/|drive\.google\.com\/file\/d\/)([-\w]+)/);

    if (idMatch && idMatch[1]) {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    }

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            console.error(`Failed to fetch Colab content: ${response.status} ${response.statusText}`);
            return null;
        }

        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            // If it's not JSON, maybe it's raw code or something else, but Colab should be JSON.
            // If the link is a "view" link that returns HTML, this will fail.
            console.error("Response is not JSON");
            return null;
        }

        // Extract code cells
        let codeContent = "";
        if (json.cells && Array.isArray(json.cells)) {
            json.cells.forEach((cell: any) => {
                if (cell.cell_type === "code") {
                    const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
                    codeContent += `\n# [CODE CELL]\n${source}\n`;
                } else if (cell.cell_type === "markdown") {
                    const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
                    codeContent += `\n/* [MARKDOWN CELL]\n${source}\n*/\n`;
                }
            });
            return codeContent;
        }

        return JSON.stringify(json, null, 2); // Fallback
    } catch (e) {
        console.error("Error fetching Colab content", e);
        return null;
    }
}

export async function gradeGoogleColabSubmission(
    description: string,
    colabUrl: string,
    userId?: string
): Promise<GradingResult> {
    try {
        console.log(`[GradingService] Grading Colab: ${colabUrl}`);
        const content = await fetchColabContent(colabUrl);

        if (!content) {
            throw new Error("No se pudo leer el Notebook. Asegúrate de que el enlace sea público (Cualquiera con el enlace) y apunte a un archivo válido.");
        }

        // Treat as a single file analysis
        // We use a generic name "notebook.ipynb"
        const analysis = await analyzeFile("notebook.ipynb", content, description, colabUrl, userId);

        // Reuse finalizeSubmission for consistent grading format
        const finalResult = await finalizeSubmission([analysis], description, [], userId);
        finalResult.apiRequestsCount = 2; // 1 for analyzeFile, 1 for finalizeSubmission
        return finalResult;

    } catch (error: any) {
        console.error("Gemini API Error (Colab):", error);

        const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "Error desconocido al evaluar el Notebook.");
        let errorMessage = "Error al evaluar el Notebook de Google Colab.";

        if (errorString.includes("SAFETY")) {
            errorMessage = "Evaluación detenida por filtros de seguridad.";
        } else if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            errorMessage = "Has excedido la cuota gratuita de peticiones a la IA de Gemini.";
        } else {
            errorMessage = typeof error.message === 'string' ? error.message : errorMessage;
        }

        throw new Error(errorMessage);
    }
}
