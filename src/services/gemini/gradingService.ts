import { getGeminiClient, MODEL_NAME, extractJSON, repairFeedbackText } from "./client";
import { analyzeFile, FileAnalysis } from "./codeAnalysisService";
import { githubService } from "../githubService";

export interface GradingResult {
    grade: number;
    feedback: string;
    apiRequestsCount?: number;
}

/**
 * Finalize submission by consolidating individual file analyses (REDUCE phase).
 *
 * GRADING FORMULA (deterministic, server-side):
 *   grade = sum(scoreContribution per analyzed file) / totalExpectedFiles
 *   Missing files contribute 0 to the sum.
 *   Result clamped to [0.0, 5.0], rounded to 1 decimal.
 */
export async function finalizeSubmission(
    analyses: FileAnalysis[],
    description: string,
    missingFiles: string[],
    userId?: string,
    totalExpectedFiles?: number,  // total files expected (found + missing)
    maxRetries = 3
): Promise<GradingResult> {

    // ── SERVER-SIDE GRADE FORMULA ─────────────────────────────────────────────
    const expectedTotal = totalExpectedFiles ?? (analyses.length + missingFiles.length);
    const scoreSum = analyses.reduce((sum, a) => sum + (a.scoreContribution ?? 0), 0);
    // Missing files add 0 — no extra action needed.
    const computedGrade = expectedTotal > 0
        ? Math.min(5.0, Math.max(0.0, Math.round((scoreSum / expectedTotal) * 10) / 10))
        : 0.0;

    console.log(`[GradingService] Grade formula: sum=${scoreSum.toFixed(2)} / total=${expectedTotal} = ${computedGrade}`);

    // ── FEEDBACK GENERATION (Gemini generates text only, NOT the grade) ───────
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ai = await getGeminiClient(userId);

            const compactAnalyses = analyses.map(a => ({
                filename: a.filename,
                fileUrl: a.fileUrl,
                summary: a.summary,
                errors: a.errors,
                scoreContribution: a.scoreContribution
            }));

            const missingEntries = missingFiles.map(f => ({ filename: f, scoreContribution: 0, note: "ARCHIVO FALTANTE" }));

            const analysesText = JSON.stringify(compactAnalyses, null, 2);
            const missingText = missingEntries.length > 0 ? JSON.stringify(missingEntries, null, 2) : "Ninguno";

            const prompt = `
            Actúa como un evaluador principal. Tu tarea es generar únicamente el texto de retroalimentación.
            La nota ya fue calculada matemáticamente por el servidor — NO la cambies.

            **REGLAS ESTRICTAS**:
            1. Evalúa EXCLUSIVAMENTE lo que se solicita en la "Rúbrica". No penalices por extras no pedidos.
            2. No penalices por dependencias, imports faltantes o indentación.

            **Rúbrica**: "${description}"

            **Nota final calculada**: ${computedGrade.toFixed(1)} / 5.0
            (suma de notas por archivo ${scoreSum.toFixed(2)} / ${expectedTotal} archivos esperados)

            **Archivos analizados** (incluye fileUrl — URL directa al archivo en GitHub):
            ${analysesText}

            **Archivos faltantes** (nota 0 por cada uno):
            ${missingText}

            **INSTRUCCIONES PARA EL FEEDBACK**:
            1. Inicia con una tabla: | Archivo | Nota /5 | Estado |
            2. Por cada archivo encontrado: menciona fortalezas y errores clave desde el análisis.
            3. Por cada archivo faltante: indica nota 0.
            4. Muestra la nota final ${computedGrade.toFixed(1)} / 5.0 y cómo se calculó.
            5. ENLACES: cada mención de archivo debe llevar enlace Markdown con la fileUrl:
               - Archivo: [nombre](fileUrl)
               - Línea: [archivo#L42](fileUrl#L42)
            6. Cierra con recomendaciones concretas para mejorar.

            **SALIDA REQUERIDA**:
            Devuelve ÚNICAMENTE el texto en formato Markdown. NO uses JSON. No envuelvas tu respuesta con bloques \`\`\`json. Escribe la retroalimentación directamente.
            `;

            const result = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { maxOutputTokens: 8192 } // No responseMimeType
            });

            let text = result.text;
            if (!text) {
                throw new Error("No response text received from AI");
            }

            // Clean up if the AI still wrapped it in generic markdown blocks
            if (text.startsWith("\`\`\`markdown")) {
                text = text.replace(/^\`\`\`markdown\n/, "").replace(/\n\`\`\`$/, "");
            } else if (text.startsWith("\`\`\`")) {
                text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
            }

            let feedbackValue = repairFeedbackText(text);

            // Return with the SERVER-computed grade — Gemini does NOT decide the grade
            return {
                grade: computedGrade,
                feedback: feedbackValue || "Sin retroalimentación disponible."
            };
        } catch (error: any) {
            console.error(`Gemini API Error (Finalize) - Attempt ${attempt}:`, error);

            const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "Error desconocido al evaluar.");

            if (
                errorString.includes("429") ||
                errorString.toLowerCase().includes("quota") ||
                errorString.toLowerCase().includes("exhausted") ||
                errorString.includes("RESOURCE_EXHAUSTED") ||
                errorString.includes("503") ||
                errorString.includes("500")
            ) {
                if (attempt < maxRetries) {
                    const delayMs = 4000 * Math.pow(2, attempt - 1);
                    console.warn(`[GradingService] Rate limit en finalizeSubmission. Reintentando en ${delayMs}ms (${attempt}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
            }

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
    throw new Error('Fallback return. This should never be reached.');
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

        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const content = await githubService.getFileContent(repoInfo.owner, repoInfo.repo, path, repoInfo.branch, token || undefined);
            if (content) {
                console.log(`[GradingService] Analyzing file: ${path}`);

                // Pass accumulated context to analyzeFile (except for the first file where it's empty)
                const analysis = await analyzeFile(path, content, description, repoUrl, userId, accumulatedContext || undefined);
                apiRequestsCount++;
                analyses.push(analysis);

                // Add this file's summary to the accumulated context for the next files
                accumulatedContext += `\n- **${path}**: ${analysis.summary}`;

                // DELAY ENTRE ARCHIVOS para no saturar la API de Gemini o GitHub
                if (i < paths.length - 1) {
                    console.log(`[GradingService] Pausando 3 segundos antes del siguiente archivo para evitar rate limits...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } else {
                console.error(`[GradingService] Missing file: ${path}`);
                missingFiles.push(path);
            }
        }

        // REDUCE STEP: Consolidate analyses into final grade
        console.log(`[GradingService] Finalizing submission with ${analyses.length} analyses, ${missingFiles.length} missing.`);
        const finalResult = await finalizeSubmission(analyses, description, missingFiles, userId, paths.length);
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
