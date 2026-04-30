import { getGeminiClient, MODEL_NAME, extractJSON } from "./client";
import { githubService } from "../githubService";

export interface FileAnalysis {
    filename: string;
    repoUrl: string;
    fileUrl: string; // URL directa al archivo en GitHub (blob)
    summary: string;
    strengths: string[];
    weaknesses: string[];
    errors: Array<{ line: number; message: string }>;
    scoreContribution: number;
}

/**
 * Construye la URL de GitHub para un archivo específico dentro de un repo.
 * Ejemplo: https://github.com/owner/repo/blob/HEAD/src/Main.java
 */
function buildGitHubFileUrl(repoUrl: string, filename: string): string {
    try {
        const repoInfo = githubService.parseGitHubUrl(repoUrl);
        if (repoInfo) {
            const { owner, repo, branch } = repoInfo;
            // Use 'main' as a safer default for web links if HEAD is returned, 
            // but if a specific branch was detected, use it.
            const targetBranch = branch === "HEAD" ? "main" : branch;

            // Encode filename parts but keep slashes
            const encodedFile = filename.split('/').map(part => encodeURIComponent(part)).join('/');

            return `https://github.com/${owner}/${repo}/blob/${targetBranch}/${encodedFile}`;
        }
    } catch { }
    return repoUrl;
}

/**
 * Analyze a single code file against a rubric
 */
export async function analyzeFile(
    filename: string,
    content: string,
    description: string,
    repoUrl: string,
    userId?: string,
    previousContextText?: string,
    gradingMode: string = "normal",
    maxRetries = 3
): Promise<FileAnalysis> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ai = await getGeminiClient(userId);

            let contextSection = "";
            if (previousContextText) {
                contextSection = `
                **Contexto de dependencias (archivos evaluados previamente)**:
                El siguiente resumen de archivos ya evaluados sirve para darte contexto sobre dependencias o implementaciones que el archivo actual podría estar utilizando. 
                No evalúes ni des puntos por este código, utilízalo únicamente para comprender mejor el archivo actual y NO penalizar al estudiante por implementaciones o referencias que ya existen en estos archivos de contexto:
                ${previousContextText}
                ---
                `;
            }

            const fileUrl = buildGitHubFileUrl(repoUrl, filename);

            const prompt = `
            Actúa como un tutor experto y evaluador de código senior.
            Analiza el siguiente archivo de código individualmente con respecto a la rúbrica proporcionada.
            
            **REGLAS DE EVALUACIÓN (${gradingMode.toUpperCase()})**:
            1. Evalúa **EXCLUSIVAMENTE** lo que se solicita en la "Rúbrica/Enunciado". NO supongas que faltan características si no fueron solicitadas.
            2. Al evaluar ejercicios de Java o lenguajes orientados a objetos, **NO penalices** por problemas de dependencias o falta de imports.
            3. ${gradingMode === "strict" 
                ? "SÉ EXTREMADAMENTE ESTRICTO. Penaliza rigurosamente errores de redacción, ortografía (en comentarios y logs), falta de coherencia, cohesión y cumplimiento estricto de normatividad de documentación." 
                : gradingMode === "moderate" 
                ? "Evaluación moderada: considera legibilidad, estructura y mejores prácticas básicas además de la lógica." 
                : "Evaluación estándar: enfócate principalmente en la funcionalidad y lógica básica solicitada."}
            
            **Rúbrica/Enunciado**: "${description}"
            ${contextSection}
            **Archivo a evaluar**: ${filename}
            **URL directa del archivo en GitHub**: ${fileUrl}
            **Contenido**:
            ${content}
            
            **TAREA**:
            1. Identifica qué requisitos de la rúbrica se cumplen en este archivo evaluado.
            2. Evalúa la calidad del código (limpieza, lógica, eficiencia) PERO solo en el contexto de lo solicitado.
            3. Detecta errores específicos CON EL NÚMERO DE LÍNEA EXACTO. Para cada error usa el formato de enlace markdown: [Ver línea N](${fileUrl}#LN) donde N es el número de línea exacto.
            
            **SALIDA REQUERIDA (JSON)**:
            {
                "filename": "${filename}",
                "summary": "Resumen breve de lo que hace este archivo y cómo contribuye a la solución.",
                "strengths": ["Punto fuerte 1", "Punto fuerte 2"],
                "weaknesses": ["Debilidad 1", "Debilidad 2"],
                "errors": [
                    { "line": <número de línea EXACTO (obligatorio)>, "message": "Descripción del error — [Ver línea N](${fileUrl}#LN)" }
                ],
                "scoreContribution": <0.0 a 5.0, estimación de calidad de este archivo>
            }
            `;

            const result = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const text = result.text;
            if (!text) {
                throw new Error(`No response text received from AI for file: ${filename}`);
            }

            let analysis: FileAnalysis;
            try {
                analysis = extractJSON<FileAnalysis>(text);
            } catch (parseError: any) {
                console.error(`[CodeAnalysisService] JSON Parse Error for file: ${filename}`);
                console.error(`Error message: ${parseError.message}`);
                throw new Error(`Error al analizar el archivo ${filename}: JSON inválido generado por la IA. ${parseError.message}`);
            }

            // Add repoUrl and fileUrl to the analysis
            analysis.repoUrl = repoUrl;
            analysis.fileUrl = fileUrl;
            return analysis;
        } catch (error: any) {
            const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "");

            // Retry if it's a rate limit or exhausted resource error
            if (
                errorString.includes("429") ||
                errorString.toLowerCase().includes("quota") ||
                errorString.toLowerCase().includes("exhausted") ||
                errorString.includes("RESOURCE_EXHAUSTED") ||
                errorString.includes("503") ||
                errorString.includes("500")
            ) {
                if (attempt < maxRetries) {
                    const delayMs = 3000 * Math.pow(2, attempt - 1);
                    console.warn(`[CodeAnalysisService] Rate limit error en ${filename}. Reintentando en ${delayMs}ms (Intento ${attempt}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue; // Intentar de nuevo
                }

                console.error(`Error analyzing file ${filename} after ${maxRetries} attempts:`, error);
                const errorMessage = "Has excedido la cuota gratuita de peticiones a la IA de Gemini.";
                throw new Error(errorMessage);
            }

            console.error(`Error analyzing file ${filename}:`, error);
            return {
                filename,
                repoUrl,
                fileUrl: buildGitHubFileUrl(repoUrl, filename),
                summary: `Error al analizar este archivo: ${error.message || errorString}`,
                strengths: [],
                weaknesses: [`No se pudo analizar debido a un error: ${error.message || errorString}`],
                errors: [],
                scoreContribution: 0
            };
        }
    }
    throw new Error('Fallback return. This should never be reached.');
}
