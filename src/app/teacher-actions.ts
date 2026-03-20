"use server"

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function saveTeacherCredentialsAction(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user.role !== "teacher")) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const githubToken = formData.get("githubToken") as string;
    const geminiApiKey = formData.get("geminiApiKey") as string;

    const data: any = {};

    if (formData.has("githubToken")) {
        const githubToken = formData.get("githubToken") as string;
        data.encryptedGithubToken = githubToken ? await encrypt(githubToken) : null;
    }

    if (formData.has("geminiApiKey")) {
        const geminiApiKey = formData.get("geminiApiKey") as string;
        data.encryptedGeminiApiKey = geminiApiKey ? await encrypt(geminiApiKey) : null;
    }

    await prisma.user.update({
        where: { id: userId },
        data
    });

    // 🎯 AUDIT LOG
    try {
        const { auditLogger } = await import("@/services/auditLogger");
        await auditLogger.log({
            action: "UPDATE",
            entity: "USER",
            entityId: userId,
            userId: userId,
            userName: session.user.name || "Profesor",
            userRole: session.user.role as any,
            description: "Credenciales de API (GitHub/Gemini) actualizadas por el profesor",
            success: true,
        });
    } catch (e) {
        console.error("Failed to log audit for credentials update", e);
    }

    revalidatePath("/dashboard/teacher/settings");
    return { success: true };
}

export async function getTeacherCredentialsAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user.role !== "teacher")) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            encryptedGithubToken: true,
            encryptedGeminiApiKey: true
        }
    });

    return {
        hasGithubToken: !!user?.encryptedGithubToken,
        hasGeminiApiKey: !!user?.encryptedGeminiApiKey
    };
}
