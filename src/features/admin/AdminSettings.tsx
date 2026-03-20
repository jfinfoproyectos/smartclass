"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { updateSystemSettingsAction } from "@/app/admin-actions";
import { Key, Save, ShieldCheck, User, ActivitySquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AdminSettingsProps {
    initialSettings: {
        geminiApiKeyMode: "GLOBAL" | "USER";
        hasGlobalKey: boolean;
        hasGithubToken: boolean;
        institutionName?: string | null;
        institutionLogo?: string | null;
        institutionHeroImage?: string | null;
        footerText?: string | null;
        auditLogEnabled: boolean;
    };
}

export function AdminSettings({ initialSettings }: AdminSettingsProps) {
    const [auditLogEnabled, setAuditLogEnabled] = useState(initialSettings.auditLogEnabled);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateSystemSettingsAction({
                    auditLogEnabled: auditLogEnabled,
                });

                toast.success("Configuración guardada", {
                    description: "Los ajustes del sistema han sido actualizados"
                });
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
                    Gestiona las preferencias globales de la institución
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ActivitySquare className="h-5 w-5" />
                        Registro de Auditoría
                    </CardTitle>
                    <CardDescription>
                        Controla si el sistema registra todas las acciones de los usuarios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Monitoreo de Acciones (Audit Logs)</Label>
                            <p className="text-sm text-muted-foreground">
                                Si desactivas esta opción, el sistema dejará de guardar nuevos registros de auditoría para optimizar el rendimiento. Las acciones previas se mantendrán.
                            </p>
                        </div>
                        <Switch
                            checked={auditLogEnabled}
                            onCheckedChange={setAuditLogEnabled}
                            disabled={isPending}
                        />
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
                            <Label htmlFor="footerText">Texto del Footer</Label>
                            <Input
                                id="footerText"
                                name="footerText"
                                defaultValue={initialSettings.footerText || ""}
                                placeholder="Ej: © 2025 EIA - Todos los derechos reservados"
                            />
                            <p className="text-xs text-muted-foreground">Texto pequeño que aparecerá al final de todas las páginas (HTML permitido).</p>
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
