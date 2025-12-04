import { getGeminiClient, MODEL_NAME, extractJSON, repairFeedbackText } from "./client";
import { analyzeFile, FileAnalysis } from "./codeAnalysisService";
import { githubService } from "../githubService";

export interface GradingResult {
    grade: number;
    feedback: string;
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
    const ai = await getGeminiClient(userId);
    const analysesText = JSON.stringify(analyses, null, 2);

    const prompt = `
    Actúa como un evaluador principal. He recibido los análisis individuales de los archivos de un estudiante.
    Tu tarea es consolidar estos análisis y emitir la nota final y retroalimentación.
    
    **Rúbrica**: "${description}"
    
    **Análisis de Archivos**:
    ${analysesText}
    
    **Archivos Faltantes (CRÍTICO)**: ${missingFiles.join(", ") || "Ninguno"}
    
    **POLÍTICA DE CALIFICACIÓN**:
    1. Si faltan archivos requeridos, penaliza severamente (Nota máxima 2.0 si faltan archivos clave).
    2. Promedia la calidad de los archivos existentes.
    3. Genera un feedback constructivo y completo.
    
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

        // MAP STEP: Analyze each file individually
        for (const path of paths) {
            const content = await githubService.getFileContent(repoInfo.owner, repoInfo.repo, path, token || undefined);
            if (content) {
                console.log(`[GradingService] Analyzing file: ${path}`);
                const analysis = await analyzeFile(path, content, description, repoUrl, userId);
                analyses.push(analysis);
            } else {
                console.error(`[GradingService] Missing file: ${path}`);
                missingFiles.push(path);
            }
        }

        // REDUCE STEP: Consolidate analyses into final grade
        console.log(`[GradingService] Finalizing submission with ${analyses.length} analyses.`);
        return await finalizeSubmission(analyses, description, missingFiles, userId);

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        let errorMessage = error.message || "Error desconocido al evaluar.";
        if (errorMessage.includes("SAFETY")) {
            errorMessage = "Evaluación detenida por filtros de seguridad.";
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
        return await finalizeSubmission([analysis], description, [], userId);

    } catch (error: any) {
        console.error("Gemini API Error (Colab):", error);
        throw new Error(error.message || "Error al evaluar el Notebook de Google Colab.");
    }
}
