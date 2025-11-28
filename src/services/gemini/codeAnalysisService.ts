import { getGeminiModel, extractJSON } from "./client";

export interface FileAnalysis {
    filename: string;
    repoUrl: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    errors: Array<{ line: number; message: string }>;
    scoreContribution: number;
}

/**
 * Analyze a single code file against a rubric
 */
export async function analyzeFile(
    filename: string,
    content: string,
    description: string,
    repoUrl: string,
    userId?: string
): Promise<FileAnalysis> {
    try {
        const model = await getGeminiModel(userId);
        const prompt = `
        Actúa como un tutor experto y evaluador de código senior.
        Analiza el siguiente archivo de código individualmente con respecto a la rúbrica proporcionada.
        
        **Rúbrica/Enunciado**: "${description}"
        
        **Archivo**: ${filename}
        **Contenido**:
        ${content}
        
        **TAREA**:
        1. Identifica qué requisitos de la rúbrica se cumplen en este archivo.
        2. Evalúa la calidad del código (limpieza, lógica, eficiencia).
        3. Detecta errores específicos CON EL NÚMERO DE LÍNEA EXACTO.
        
        **SALIDA REQUERIDA (JSON)**:
        {
            "filename": "${filename}",
            "summary": "Resumen breve de lo que hace este archivo y cómo contribuye a la solución.",
            "strengths": ["Punto fuerte 1", "Punto fuerte 2"],
            "weaknesses": ["Debilidad 1", "Debilidad 2"],
            "errors": [
                { "line": <número de línea EXACTO (obligatorio)>, "message": "Descripción del error" }
            ],
            "scoreContribution": <0.0 a 5.0, estimación de calidad de este archivo>
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const text = result.response.text();

        let analysis: FileAnalysis;
        try {
            analysis = extractJSON<FileAnalysis>(text);
        } catch (parseError: any) {
            console.error(`[CodeAnalysisService] JSON Parse Error for file: ${filename}`);
            console.error(`Error message: ${parseError.message}`);
            throw new Error(`Error al analizar el archivo ${filename}: JSON inválido generado por la IA. ${parseError.message}`);
        }

        // Add repoUrl to the analysis
        analysis.repoUrl = repoUrl;
        return analysis;
    } catch (error: any) {
        console.error(`Error analyzing file ${filename}:`, error);
        return {
            filename,
            repoUrl,
            summary: `Error al analizar este archivo: ${error.message}`,
            strengths: [],
            weaknesses: [`No se pudo analizar debido a un error: ${error.message}`],
            errors: [],
            scoreContribution: 0
        };
    }
}
