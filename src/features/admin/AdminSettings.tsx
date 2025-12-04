"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { updateSystemSettingsAction } from "@/app/admin-actions";
import { Key, Save, ShieldCheck, User } from "lucide-react";

interface AdminSettingsProps {
    initialSettings: {
        geminiApiKeyMode: "GLOBAL" | "USER";
        hasGlobalKey: boolean;
        hasGithubToken: boolean;
        institutionName?: string | null;
        institutionLogo?: string | null;
        institutionHeroImage?: string | null;
    };
}

export function AdminSettings({ initialSettings }: AdminSettingsProps) {
    const [mode, setMode] = useState<"GLOBAL" | "USER">(initialSettings.geminiApiKeyMode);
    const [apiKey, setApiKey] = useState("");
    const [githubToken, setGithubToken] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (mode === "GLOBAL" && !apiKey && !initialSettings.hasGlobalKey) {
            toast.error("Error", {
                description: "Debes ingresar una API Key global"
            });
            return;
        }

        startTransition(async () => {
            try {
                await updateSystemSettingsAction({
                    geminiApiKeyMode: mode,
                    globalApiKey: apiKey || undefined,
                    githubToken: githubToken || undefined
                });

                toast.success("Configuración guardada", {
                    description: "Los ajustes del sistema han sido actualizados"
                });

                if (apiKey) setApiKey("");
                if (githubToken) setGithubToken("");
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
                <h2 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h2>
                <p className="text-muted-foreground">
                    Gestiona las claves de API y preferencias globales
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Configuración de Gemini AI
                    </CardTitle>
                    <CardDescription>
                        Define cómo se gestionan las claves de API para los servicios de inteligencia artificial
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Modo de API Key</Label>
                        <RadioGroup
                            value={mode}
                            onValueChange={(v) => setMode(v as "GLOBAL" | "USER")}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            disabled={isPending}
                        >
                            <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-4 ${mode === "GLOBAL" ? "border-primary bg-primary/5" : ""}`}>
                                <RadioGroupItem value="GLOBAL" id="global" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="global" className="font-medium flex items-center gap-2 cursor-pointer">
                                        <ShieldCheck className="h-4 w-4" />
                                        API Key Global (Administrador)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        El administrador proporciona una única clave que utilizan todos los usuarios. Recomendado para control centralizado.
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-4 ${mode === "USER" ? "border-primary bg-primary/5" : ""}`}>
                                <RadioGroupItem value="USER" id="user" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="user" className="font-medium flex items-center gap-2 cursor-pointer">
                                        <User className="h-4 w-4" />
                                        API Key por Usuario
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Cada usuario (profesor/estudiante) debe proporcionar su propia clave en su perfil.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {mode === "GLOBAL" && (
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Gemini API Key Global</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder={initialSettings.hasGlobalKey ? "•••••••••••••••• (Clave configurada)" : "Ingresa la API Key de Google Gemini"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                La clave se almacenará encriptada en la base de datos.
                                {initialSettings.hasGlobalKey && " Deja este campo vacío para mantener la clave actual."}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Configuración de GitHub API
                    </CardTitle>
                    <CardDescription>
                        Configura un token de acceso personal de GitHub para aumentar los límites de peticiones
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-sm">Límites de Peticiones</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Sin token:</p>
                                <p className="font-bold">60 peticiones/hora</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Con token:</p>
                                <p className="font-bold text-green-600">5,000 peticiones/hora</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="githubToken">GitHub Personal Access Token (Opcional)</Label>
                        <Input
                            id="githubToken"
                            type="password"
                            placeholder={initialSettings.hasGithubToken ? "•••••••••••••••• (Token configurado)" : "Ingresa tu GitHub Personal Access Token"}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            disabled={isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            El token se almacenará encriptado.
                            {initialSettings.hasGithubToken && " Deja este campo vacío para mantener el token actual."}
                            {" "}
                            <a
                                href="https://github.com/settings/tokens/new?scopes=public_repo&description=SmartClass"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Crear token en GitHub →
                            </a>
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Personalización de la Institución</CardTitle>
                    <CardDescription>Define el nombre y logo que aparecerán en la página de inicio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        const { updateSettingsAction } = await import("@/app/actions");
                        await updateSettingsAction(formData);
                        toast.success("Configuración actualizada");
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="institutionName">Nombre de la Institución</Label>
                            <Input
                                id="institutionName"
                                name="institutionName"
                                defaultValue={initialSettings.institutionName || ""}
                                placeholder="Ej: Universidad EIA"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="institutionLogo">URL del Logo</Label>
                            <Input
                                id="institutionLogo"
                                name="institutionLogo"
                                defaultValue={initialSettings.institutionLogo || ""}
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">URL directa a la imagen del logo (PNG o SVG recomendado).</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="institutionHeroImage">Imagen de Fondo (Hero)</Label>
                            <Input
                                id="institutionHeroImage"
                                name="institutionHeroImage"
                                defaultValue={initialSettings.institutionHeroImage || ""}
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">URL de la imagen de fondo para la página de inicio.</p>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit">Guardar Personalización</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
