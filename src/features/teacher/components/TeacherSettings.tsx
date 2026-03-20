"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveTeacherCredentialsAction } from "@/app/teacher-actions";
import { Key, Save, Github } from "lucide-react";

interface TeacherSettingsProps {
    initialCredentials: {
        hasGithubToken: boolean;
        hasGeminiApiKey: boolean;
    };
}

export function TeacherSettings({ initialCredentials }: TeacherSettingsProps) {
    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [githubToken, setGithubToken] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (!geminiApiKey && !githubToken && !initialCredentials.hasGeminiApiKey && !initialCredentials.hasGithubToken) {
            toast.error("Error", {
                description: "Debes ingresar al menos una credencial para guardar"
            });
            return;
        }

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (geminiApiKey) formData.append("geminiApiKey", geminiApiKey);
                if (githubToken) formData.append("githubToken", githubToken);

                await saveTeacherCredentialsAction(formData);

                toast.success("Configuración guardada", {
                    description: "Tus credenciales personales han sido actualizadas"
                });

                setGeminiApiKey("");
                setGithubToken("");
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo guardar la configuración"
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración Personal</h2>
                <p className="text-muted-foreground">
                    Gestiona tus propias llaves de API para evaluaciones y actividades
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Google Gemini API
                    </CardTitle>
                    <CardDescription>
                        Esta llave se utilizará para calificar las actividades de tus estudiantes y generar contenido con IA.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                        <Input
                            id="geminiApiKey"
                            type="password"
                            placeholder={initialCredentials.hasGeminiApiKey ? "•••••••••••••••• (Clave configurada)" : "Ingresa tu API Key de Google Gemini"}
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            disabled={isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            La clave se almacena de forma encriptada. {initialCredentials.hasGeminiApiKey && "Deja vacío para mantener la actual."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        GitHub API
                    </CardTitle>
                    <CardDescription>
                        Configura tu Personal Access Token para acceder a los repositorios de tus estudiantes sin restricciones de cuota.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
                        <Input
                            id="githubToken"
                            type="password"
                            placeholder={initialCredentials.hasGithubToken ? "•••••••••••••••• (Token configurado)" : "Ingresa tu GitHub Personal Access Token"}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            disabled={isPending}
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>El token se almacena de forma encriptada.</span>
                            <a
                                href="https://github.com/settings/tokens/new?scopes=public_repo&description=SmartClass_Teacher"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Crear token en GitHub →
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Guardando..." : "Guardar mis Credenciales"}
                </Button>
            </div>
        </div>
    );
}
