import { GoogleGenAI } from "@google/genai";
import { decrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";

export const MODEL_NAME = "gemini-2.5-flash";

/**
 * Get a configured GoogleGenAI instance
 * @param userId - Optional user ID for fetching user-specific API key
 * @returns GoogleGenAI instance configured with the appropriate API key
 */
export async function getGeminiClient(userId?: string): Promise<GoogleGenAI> {

    // Get system settings
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" }
    });

    let apiKey = process.env.GEMINI_API_KEY;

    if (settings) {
        if (settings.geminiApiKeyMode === "GLOBAL" && settings.encryptedGlobalApiKey) {
            try {
                apiKey = await decrypt(settings.encryptedGlobalApiKey);
            } catch (error) {
                console.error("Error decrypting global API key:", error);
            }
        } else if (settings.geminiApiKeyMode === "USER" && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { encryptedGeminiApiKey: true }
            });

            if (user?.encryptedGeminiApiKey) {
                try {
                    apiKey = await decrypt(user.encryptedGeminiApiKey);
                } catch (error) {
                    console.error("Error decrypting user API key:", error);
                }
            }
        }
    }

    if (!apiKey) {
        throw new Error("Gemini API Key not configured. Please contact the administrator.");
    }

    // Return the GoogleGenAI instance - use ai.models.generateContent() to make calls
    return new GoogleGenAI({ apiKey });
}

/**
 * Extract and parse JSON from AI response text
 * Handles cases where JSON is wrapped in markdown code blocks or has extra text
 */
export function extractJSON<T = any>(text: string): T {
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');

    let jsonStr = text;
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
        jsonStr = text.substring(firstOpenBrace, lastCloseBrace + 1);
    }

    // Sanitize common LLM JSON errors:
    // 1. Literal control characters (like raw newlines, tabs) inside string values
    // This regex finds content between double quotes and replaces literal newlines/tabs with escapes
    const sanitize = (str: string) => {
        return str.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
            // Replace raw control characters (0-31) with their escaped versions
            const escaped = content
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/[\x00-\x1f]/g, (ch: string) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
            return `"${escaped}"`;
        });
    };

    try {
        return JSON.parse(sanitize(jsonStr));
    } catch (primaryError) {
        // Fallback: try to extract JSON from a markdown code block (```json ... ```)
        const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch?.[1]) {
            try {
                return JSON.parse(sanitize(markdownMatch[1]));
            } catch {
                // Ignore fallback error, throw the original
            }
        }
        throw primaryError;
    }
}

/**
 * Repair escaped characters in feedback text
 */
export function repairFeedbackText(text: string): string {
    if (typeof text !== 'string') return text;
    return text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}
