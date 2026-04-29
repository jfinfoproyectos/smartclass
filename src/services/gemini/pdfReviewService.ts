import { getGeminiClient, MODEL_NAME, repairFeedbackText } from "./client";
import type { GradingResult } from "./gradingService";
import { GoogleGenAI } from "@google/genai";

/**
 * Attempts to fetch a PDF from a URL and return its text content.
 * Supports Google Drive share links.
 */
async function fetchPdfContent(url: string): Promise<{ base64: string; mimeType: string } | null> {
    let fetchUrl = url;

    // Convert Google Drive share links to a direct download URL
    const driveMatch = url.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([-\w]+)/);
    if (driveMatch && driveMatch[1]) {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }

    try {
        const response = await fetch(fetchUrl, { redirect: "follow" });

        if (!response.ok) {
            console.error(`[PdfReviewService] Failed to fetch PDF: ${response.status} ${response.statusText}`);
            return null;
        }

        const buffer = await response.arrayBuffer();

        // Guard: reject files larger than 15 MB to avoid Gemini inline data limits
        if (buffer.byteLength > 15 * 1024 * 1024) {
            throw new Error(
                "El archivo PDF es demasiado grande (máx. 15 MB). Comprime el documento o usa un PDF más liviano."
            );
        }

        const base64 = Buffer.from(buffer).toString("base64");

        // Always force application/pdf — Google Drive returns "application/octet-stream"
        // in Content-Type, which Gemini rejects. We know it's a PDF by context.
        return { base64, mimeType: "application/pdf" };
    } catch (e: any) {
        // Re-throw sized-based error directly
        if (e.message?.includes("demasiado grande")) throw e;
        console.error("[PdfReviewService] Error fetching PDF content:", e);
        return null;
    }
}


/**
 * Grade a PDF submission against a list of criteria using Gemini.
 * The criteria are extracted from the activity's `statement` (Markdown).
 */
export async function gradePdfReviewSubmission(
    criteria: string,
    pdfUrl: string,
    teacherId?: string
): Promise<GradingResult> {
    const ai = await getGeminiClient(teacherId);

    console.log(`[PdfReviewService] Starting PDF review for: ${pdfUrl}`);

    // 1. Download PDF
    const pdfData = await fetchPdfContent(pdfUrl);
    if (!pdfData) {
        throw new Error(
            "No se pudo descargar el PDF. Asegúrate de que el enlace sea público y apunte a un archivo PDF válido (Google Drive: 'Cualquiera con el enlace puede ver')."
        );
    }

    // 2. Build prompt with inline PDF data
    const prompt = `Eres un evaluador académico experto. Tu tarea es evaluar el documento PDF adjunto basándote EXCLUSIVAMENTE en los criterios de evaluación proporcionados.

**CRITERIOS DE EVALUACIÓN (Rúbrica)**:
${criteria}

**INSTRUCCIONES PARA LA EVALUACIÓN**:
1. Lee el documento completo.
2. Para cada criterio, asigna una puntuación parcial basada en el peso indicado.
3. La nota final es la suma de todas las puntuaciones parciales (escala 0.0 a 5.0).
4. Si la suma supera 5.0, limítala a 5.0.

**FORMATO DE RESPUESTA** (JSON estricto):
{
  "grade": <número decimal entre 0.0 y 5.0>,
  "criteriaResults": [
    {
      "criterion": "<nombre del criterio>",
      "maxPoints": <puntos máximos del criterio>,
      "earnedPoints": <puntos obtenidos>,
      "comment": "<observación específica sobre este criterio>"
    }
  ],
  "generalFeedback": "<retroalimentación general sobre el documento>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"],
  "improvements": ["<mejora 1>", "<mejora 2>"]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON. No incluyas texto adicional, no uses bloques de código markdown.`;

    let apiRequestsCount = 1;

    try {
        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                data: pdfData.base64,
                                mimeType: pdfData.mimeType,
                            },
                        },
                        { text: prompt },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 4096,
            },
        });

        const text = result.text;
        if (!text) throw new Error("No response text received from AI");

        let parsed: any;
        try {
            // Clean potential markdown code blocks
            const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
            parsed = JSON.parse(clean);
        } catch {
            throw new Error("La IA devolvió una respuesta con formato inválido. Por favor intenta nuevamente.");
        }

        const grade = Math.min(5.0, Math.max(0.0, parseFloat(parsed.grade) || 0));

        // Build structured markdown feedback
        const feedbackLines: string[] = [];
        feedbackLines.push(`## Evaluación de PDF — Nota: ${grade.toFixed(1)} / 5.0\n`);

        if (parsed.criteriaResults && Array.isArray(parsed.criteriaResults)) {
            feedbackLines.push("### Resultados por Criterio\n");
            feedbackLines.push("| Criterio | Nota obtenida | Nota máxima | Comentario |");
            feedbackLines.push("|----------|:-------------:|:-----------:|------------|");
            for (const cr of parsed.criteriaResults) {
                feedbackLines.push(
                    `| ${cr.criterion || "—"} | **${parseFloat(cr.earnedPoints || 0).toFixed(1)}** | ${parseFloat(cr.maxPoints || 0).toFixed(1)} | ${cr.comment || "—"} |`
                );
            }
            feedbackLines.push("");
        }

        if (parsed.strengths && parsed.strengths.length > 0) {
            feedbackLines.push("### ✅ Fortalezas");
            for (const s of parsed.strengths) feedbackLines.push(`- ${s}`);
            feedbackLines.push("");
        }

        if (parsed.improvements && parsed.improvements.length > 0) {
            feedbackLines.push("### 🔧 Aspectos a Mejorar");
            for (const m of parsed.improvements) feedbackLines.push(`- ${m}`);
            feedbackLines.push("");
        }

        if (parsed.generalFeedback) {
            feedbackLines.push("### 📝 Retroalimentación General");
            feedbackLines.push(parsed.generalFeedback);
        }

        const feedback = repairFeedbackText(feedbackLines.join("\n"));

        console.log(`[PdfReviewService] Evaluation complete. Grade: ${grade.toFixed(1)}/5.0`);

        return {
            grade,
            feedback,
            apiRequestsCount,
        };
    } catch (error: any) {
        console.error("[PdfReviewService] Gemini API Error:", error);

        const errorString = typeof error === "string" ? error : error.message || JSON.stringify(error) || "";
        let errorMessage = "Error al evaluar el PDF.";

        if (errorString.includes("SAFETY")) {
            errorMessage = "Evaluación detenida por filtros de seguridad.";
        } else if (
            errorString.includes("429") ||
            errorString.toLowerCase().includes("quota") ||
            errorString.toLowerCase().includes("exhausted") ||
            errorString.includes("RESOURCE_EXHAUSTED")
        ) {
            errorMessage = "Has excedido la cuota de peticiones a la IA de Gemini. Intenta más tarde.";
        } else if (errorString.length > 0) {
            errorMessage = errorString;
        }

        throw new Error(errorMessage);
    }
}
