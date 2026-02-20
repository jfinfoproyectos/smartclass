import { getGeminiClient, MODEL_NAME, extractJSON } from "./client";

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
    userId?: string,
    previousContextText?: string
): Promise<FileAnalysis> {
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

        const prompt = `
        Actúa como un tutor experto y evaluador de código senior.
        Analiza el siguiente archivo de código individualmente con respecto a la rúbrica proporcionada.
        
        **REGLAS ESTRICTAS**: 
        1. Evalúa **EXCLUSIVAMENTE** lo que se solicita en la "Rúbrica/Enunciado". NO supongas que faltan características, manejo de errores, o funcionalidades adicionales si no fueron explícitamente solicitadas en la rúbrica.
        2. Al evaluar ejercicios de Java o lenguajes orientados a objetos, **NO penalices** por problemas de dependencias, falta de imports, o clases no definidas en el archivo. Asume que están en el contexto del proyecto.
        3. No evalúes estrictamente inconsistencias menores de indentación o formato. Evalúa solo la calidad de la lógica construida.
        
        **Rúbrica/Enunciado**: "${description}"
        ${contextSection}
        **Archivo a evaluar**: ${filename}
        **Contenido**:
        ${content}
        
        **TAREA**:
        1. Identifica qué requisitos de la rúbrica se cumplen en este archivo evaluado.
        2. Evalúa la calidad del código (limpieza, lógica, eficiencia) PERO solo en el contexto de lo solicitado.
        3. Detecta errores específicos CON EL NÚMERO DE LÍNEA EXACTO, pero solo penaliza errores reales o cosas que incumplan la rúbrica (no penalices por "falta de extras").
        
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

        // Add repoUrl to the analysis
        analysis.repoUrl = repoUrl;
        return analysis;
    } catch (error: any) {
        console.error(`Error analyzing file ${filename}:`, error);

        const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "");

        if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            const errorMessage = "Has excedido la cuota gratuita de peticiones a la IA de Gemini.";
            throw new Error(errorMessage);
        }

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
