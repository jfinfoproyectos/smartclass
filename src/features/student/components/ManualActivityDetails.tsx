"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Link as LinkIcon, AlertCircle } from "lucide-react";
import { FeedbackViewer } from "../FeedbackViewer";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submitActivityAction } from "@/app/actions";
import { useFormState } from "react-dom";
import { toast } from "sonner";

interface ManualActivityDetailsProps {
    activity: any;
    userId: string;
    studentName: string;
}

const initialState = {
    message: "",
    error: false,
};

export function ManualActivityDetails({ activity, userId, studentName }: ManualActivityDetailsProps) {
    const submission = activity.submissions?.[0];
    const isGraded = submission && submission.grade !== null;
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [state, formAction] = useFormState(submitActivityAction, initialState);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (state.message) {
            if (state.error) {
                toast.error("Error", { description: state.message });
            } else {
                toast.success("Éxito", { description: state.message });
            }
        }
    }, [state]);

    const mode = mounted ? (resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto") : "light";

    return (
        <div className="space-y-6 w-full p-6">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{activity.title}</h1>
                    <p className="text-muted-foreground">{activity.course.title}</p>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Estado de la Actividad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Estado:</span>
                                {isGraded ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Calificado</Badge>
                                ) : submission ? (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Entregado - Pendiente de Calificación</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">Sin Entregar</Badge>
                                )}
                            </div>

                            {isGraded && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Nota:</span>
                                    <span className="text-2xl font-bold text-primary">{submission.grade.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Show submitted link if exists */}
                        {submission && submission.url && (
                            <div className="rounded-lg border p-4 bg-muted/30">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    Enlace Enviado
                                </h4>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={submission.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm break-all flex items-center gap-1"
                                    >
                                        {submission.url}
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Última actualización: {new Date(submission.lastSubmittedAt || submission.createdAt).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Submission form - only show if not graded AND allowLinkSubmission is enabled AND deadline not passed */}
                        {!isGraded && activity.allowLinkSubmission && (
                            activity.deadline && new Date(activity.deadline) < new Date() ? (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-md flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Actividad Cerrada</p>
                                        <p className="text-xs opacity-90">
                                            La fecha límite para esta actividad ha pasado. Ya no se aceptan entregas por enlace.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border p-4 bg-card">
                                    <h4 className="font-semibold mb-3">
                                        {submission ? "Actualizar Enlace de Entrega" : "Enviar Enlace de Entrega"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Envía un enlace a tu trabajo (Google Drive, OneDrive, sitio web, etc.) para que el profesor lo revise manualmente.
                                    </p>
                                    <form action={formAction} className="space-y-4">
                                        <input type="hidden" name="activityId" value={activity.id} />
                                        <div className="space-y-2">
                                            <Label htmlFor="url">Enlace de Entrega</Label>
                                            <Input
                                                id="url"
                                                name="url"
                                                type="url"
                                                placeholder="https://drive.google.com/..."
                                                defaultValue={submission?.url || ""}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Asegúrate de que el enlace sea accesible para el profesor.
                                            </p>
                                        </div>
                                        <Button type="submit" className="w-full">
                                            {submission ? "Actualizar Entrega" : "Enviar Entrega"}
                                        </Button>
                                    </form>
                                </div>
                            )
                        )}

                        {/* Message when link submission is disabled */}
                        {!isGraded && !activity.allowLinkSubmission && (
                            <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">
                                    El profesor no ha habilitado el envío de enlaces para esta actividad.
                                    <br />
                                    Esta actividad será calificada manualmente por el profesor.
                                </p>
                            </div>
                        )}

                        {isGraded && (
                            <div className="text-center py-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                                    ✓ Esta actividad ya ha sido calificada por el profesor.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Tabs defaultValue="statement" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="statement">Enunciado / Rúbrica</TabsTrigger>
                        <TabsTrigger value="feedback">Retroalimentación</TabsTrigger>
                    </TabsList>

                    <TabsContent value="statement" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Enunciado / Rúbrica</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div data-color-mode={mode} className="w-full max-w-full overflow-hidden [&_pre]:whitespace-pre-wrap! [&_pre]:wrap-break-word! [&_table]:w-full! [&_td]:wrap-break-word!">
                                    <MDEditor.Markdown source={activity.statement || "**No hay enunciado disponible.**"} style={{ background: 'transparent' }} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="feedback" className="mt-4">
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Retroalimentación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isGraded && submission.feedback ? (
                                    <FeedbackViewer feedback={submission.feedback} />
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Aún no hay retroalimentación disponible para esta actividad.</p>
                                        {!isGraded && <p className="text-sm mt-2">El profesor aún no ha calificado esta actividad.</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

