import { getGeminiClient, MODEL_NAME } from "./client";

/**
 * Generate activity description/instructions using Gemini AI
 */
export async function generateActivityDescription(
    prompt: string,
    activityType: string,
    userId: string
): Promise<string> {
    const ai = await getGeminiClient(userId);

    const systemPrompt = `Eres un asistente educativo experto en crear instrucciones claras y detalladas para actividades académicas.
Tu tarea es generar instrucciones informativas para una actividad de tipo ${activityType}.

Las instrucciones deben:
- Ser claras y fáciles de entender
- Incluir el contexto y objetivos de aprendizaje
- Proporcionar información útil para los estudiantes
- Estar en formato Markdown
- Ser concisas pero completas (200-400 palabras)

NO incluyas:
- Criterios de evaluación (eso va en el enunciado)
- Rúbricas de calificación
- Puntos específicos a evaluar

Genera instrucciones para: ${prompt}`;

    const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: systemPrompt
    });

    if (!result.text) {
        throw new Error("No se pudo generar contenido");
    }

    return result.text;
}

/**
 * Generate activity statement/rubric using Gemini AI
 */
export async function generateActivityStatement(
    prompt: string,
    activityType: string,
    userId: string
): Promise<string> {
    const ai = await getGeminiClient(userId);

    const systemPrompt = `Eres un asistente educativo experto en crear enunciados y rúbricas de evaluación para actividades académicas.
Tu tarea es generar un enunciado detallado con rúbrica de evaluación para una actividad de tipo ${activityType}.

El enunciado debe incluir:
- Descripción clara de lo que se debe entregar
- Requisitos específicos y detallados
- Rúbrica de evaluación con criterios y porcentajes
- Formato de entrega esperado
- Ejemplos si es apropiado
- Estar en formato Markdown con tablas para la rúbrica

Estructura sugerida:
# Enunciado
[Descripción de la actividad]

## Requisitos
- Requisito 1
- Requisito 2
...

## Rúbrica de Evaluación
| Criterio | Descripción | Porcentaje |
|----------|-------------|------------|
| ... | ... | ... |

## Formato de Entrega
[Especificaciones del formato]

Genera un enunciado completo con rúbrica para: ${prompt}`;

    const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: systemPrompt
    });

    if (!result.text) {
        throw new Error("No se pudo generar contenido");
    }

    return result.text;
}
