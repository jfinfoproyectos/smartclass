import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function getGithubToken(): Promise<string | null> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "settings" },
            select: { encryptedGithubToken: true }
        });

        if (!settings?.encryptedGithubToken) {
            return null;
        }

        return await decrypt(settings.encryptedGithubToken);
    } catch (error) {
        console.error("Error fetching GitHub token:", error);
        return null;
    }
}
