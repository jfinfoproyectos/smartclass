"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ExternalLink, CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { FeedbackViewer } from "../FeedbackViewer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { fetchRepoFilesAction, analyzeFileAction, finalizeSubmissionAction } from "@/app/actions";
import { useReactToPrint } from 'react-to-print';
import { ActivityReportTemplate } from '../ActivityReportTemplate';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from "next-themes";

interface GithubActivityDetailsProps {
    activity: any;
    userId: string;
    studentName: string;
}

export function GithubActivityDetails({ activity, userId, studentName }: GithubActivityDetailsProps) {
    const submission = activity.submissions?.[0];
    const attemptCount = submission?.attemptCount || 0;
    const maxAttempts = activity.maxAttempts || 1;

    const isSubmitted = !!submission;
    const isGraded = submission && submission.grade !== null;
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(isGraded ? "feedback" : "instructions");
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Informe_${activity.title.replace(/\s+/g, '_')}`,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isGraded) {
            setActiveTab("feedback");
        }
    }, [isGraded]);

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
                        <CardTitle>Estado de la Entrega (GitHub)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Estado:</span>
                                {isGraded ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Calificado</Badge>
                                ) : isSubmitted ? (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Enviado</Badge>
                                ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Pendiente</Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Intentos:</span>
                                <span className="text-sm text-muted-foreground">{attemptCount} / {maxAttempts}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Vencimiento:</span>
                                <span className="text-sm text-muted-foreground">{format(new Date(activity.deadline), "PP p")}</span>
                            </div>

                            {isGraded && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Nota:</span>
                                        <span className="text-2xl font-bold text-primary">{submission.grade.toFixed(1)}</span>
                                    </div>

                                    <div style={{ display: 'none' }}>
                                        <ActivityReportTemplate
                                            ref={componentRef}
                                            activity={activity}
                                            submission={submission}
                                            studentName={studentName}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handlePrint()}
                                    >
                                        <Download className="h-4 w-4" />
                                        Descargar Informe
                                    </Button>
                                </div>
                            )}
                        </div>

                        {maxAttempts > 1 && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-md flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p className="text-xs">
                                    <strong>Nota importante:</strong> Tienes {maxAttempts} intentos disponibles. Se guardará automáticamente la nota más alta que obtengas entre todos tus intentos.
                                </p>
                            </div>
                        )}

                        <Separator />

                        {isSubmitted ? (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tu entrega más reciente:</Label>
                                    <a href={submission.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1">
                                        <ExternalLink className="h-3 w-3" />
                                        {submission.url}
                                    </a>
                                </div>

                                {attemptCount < maxAttempts && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="text-sm font-medium mb-4">Nueva Entrega (Intento {attemptCount + 1})</h4>
                                        <SubmissionForm
                                            activityId={activity.id}
                                            description={activity.description}
                                            filePaths={activity.filePaths || ""}
                                            onEvaluationComplete={() => setActiveTab("feedback")}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <SubmissionForm
                                activityId={activity.id}
                                description={activity.description}
                                filePaths={activity.filePaths || ""}
                                onEvaluationComplete={() => setActiveTab("feedback")}
                            />
                        )}
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
                        <TabsTrigger value="rubric">Enunciado / Rúbrica</TabsTrigger>
                        <TabsTrigger value="feedback">Retroalimentación</TabsTrigger>
                    </TabsList>

                    <TabsContent value="instructions" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Instrucciones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activity.filePaths && (
                                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-primary" />
                                            Archivos Requeridos para Evaluación
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            El sistema buscará y evaluará estrictamente los siguientes archivos en tu repositorio. Asegúrate de que existan y tengan el nombre correcto.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {activity.filePaths.split(',').map((path: string, index: number) => (
                                                <Badge key={index} variant="outline" className="font-mono text-xs bg-background">
                                                    {path.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div data-color-mode={mode}>
                                    <MDEditor.Markdown source={activity.description || "**No hay instrucciones disponibles.**"} style={{ background: 'transparent' }} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="rubric" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Enunciado / Rúbrica de Evaluación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div data-color-mode={mode}>
                                    <MDEditor.Markdown source={activity.statement || "**No hay rúbrica disponible.**"} style={{ background: 'transparent' }} />
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
                                {isSubmitted && submission.feedback ? (
                                    <FeedbackViewer feedback={submission.feedback} />
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Aún no hay retroalimentación disponible para esta actividad.</p>
                                        {!isSubmitted && <p className="text-sm mt-2">Debes realizar una entrega para recibir retroalimentación.</p>}
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

function SubmissionForm({ activityId, description, filePaths, onEvaluationComplete }: { activityId: string, description: string, filePaths: string, onEvaluationComplete?: () => void }) {
    const [status, setStatus] = useState<'idle' | 'grading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const url = formData.get("url") as string;

        if (!url) return;

        setStatus('grading');
        setError(null);
        setLogs([]);
        setProgress("Iniciando evaluación...");

        try {
            // 1. Fetch files
            addLog("🔍 Buscando archivos en el repositorio...");
            const { validFiles, missingFiles } = await fetchRepoFilesAction(url, filePaths);

            if (validFiles.length === 0 && missingFiles.length > 0) {
                throw new Error(`No se encontraron archivos requeridos: ${missingFiles.join(", ")}`);
            }

            addLog(`✅ Encontrados ${validFiles.length} archivos. Faltantes: ${missingFiles.length}`);

            // 2. Analyze each file
            const analyses = [];
            for (const file of validFiles) {
                addLog(`🤖 Analizando ${file.path}...`);
                setProgress(`Analizando ${file.path}...`);

                try {
                    const analysis = await analyzeFileAction(file.path, file.content, description, url);
                    analyses.push(analysis);

                    if (analysis.scoreContribution > 3) {
                        addLog(`✨ ${file.path}: Buen trabajo (${analysis.scoreContribution.toFixed(1)}/5.0)`);
                    } else {
                        addLog(`⚠️ ${file.path}: Requiere mejoras (${analysis.scoreContribution.toFixed(1)}/5.0)`);
                    }

                    // Show errors if any
                    if (analysis.errors && analysis.errors.length > 0) {
                        analysis.errors.forEach((err: any) => {
                            addLog(`❌ [${file.path}:${err.line || '?'}] ${err.message}`);
                        });
                    }
                } catch (fileError: any) {
                    addLog(`❌ Error al analizar ${file.path}: ${fileError.message}`);
                    // Continue with other files even if one fails
                    analyses.push({
                        filename: file.path,
                        repoUrl: url,
                        summary: `Error al analizar: ${fileError.message}`,
                        strengths: [],
                        weaknesses: [`Error de análisis: ${fileError.message}`],
                        errors: [],
                        scoreContribution: 0
                    });
                }
            }

            // 3. Finalize
            addLog("🏁 Calculando nota final...");
            setProgress("Finalizando evaluación...");
            await finalizeSubmissionAction(activityId, url, analyses, description, missingFiles);

            setStatus('success');
            addLog("🎉 Evaluación completada exitosamente.");

            // Call the callback to switch to feedback tab
            if (onEvaluationComplete) {
                setTimeout(() => {
                    onEvaluationComplete();
                }, 1000); // Small delay to let user see success message
            }

            router.refresh();
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setError(err.message || "Ocurrió un error inesperado");
            addLog(`❌ Error: ${err.message}`);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="url">URL del Repositorio GitHub</Label>
                <div className="flex gap-2">
                    <Input
                        id="url"
                        name="url"
                        placeholder="https://github.com/usuario/repositorio"
                        required
                        disabled={status === 'grading'}
                    />
                    <Button type="submit" disabled={status === 'grading'}>
                        {status === 'grading' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Evaluando
                            </>
                        ) : (
                            "Entregar Tarea"
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Asegúrate de que el repositorio sea público o que el sistema tenga acceso.
                </p>
            </div>

            {status === 'grading' && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 wrap-break-word">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        <span className="wrap-break-word">{progress}</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto text-xs font-mono bg-background p-2 rounded border">
                        {logs.map((log, i) => (
                            <div key={i} className="wrap-break-word">{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Error en la evaluación</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="p-4 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-sm">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">¡Entrega evaluada correctamente!</p>
                </div>
            )}
        </form>
    );
}
