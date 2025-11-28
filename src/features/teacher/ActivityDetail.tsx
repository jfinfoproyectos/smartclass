"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Eye, ArrowLeft, Github, FileText, ClipboardList, Users, Trash2, Sparkles, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { FeedbackViewer } from "../student/FeedbackViewer";
import { deleteSubmissionAction, validateUniqueLinksAction } from "@/app/actions";
import { toast } from "sonner";
import { ExportButton } from "@/components/ui/export-button";
import { formatDateForExport, formatGradeForExport } from "@/lib/export-utils";

import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from "next-themes";

export function ActivityDetail({
    activity,
    students
}: {
    activity: any,
    students: any[]
}) {
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState<any>(null);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [validationResults, setValidationResults] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Map students to their submission status
    const studentStatus = students.map(enrollment => {
        const student = enrollment.user;
        const submission = activity.submissions.find((sub: any) => sub.userId === student.id);

        return {
            student,
            submission,
            status: submission ? (submission.grade !== null ? "graded" : "submitted") : "pending"
        };
    });

    const { resolvedTheme } = useTheme();
    const mode = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto";

    const handleDeleteSubmission = (submission: any) => {
        setSubmissionToDelete(submission);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!submissionToDelete) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("submissionId", submissionToDelete.id);
                formData.append("courseId", activity.courseId);
                formData.append("activityId", activity.id);

                await deleteSubmissionAction(formData);

                toast.success("Entrega eliminada", {
                    description: "La entrega del estudiante ha sido eliminada exitosamente.",
                });

                setDeleteDialogOpen(false);
                setSubmissionToDelete(null);
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo eliminar la entrega.",
                });
            }
        });
    };

    const handleValidateLinks = async () => {
        setIsValidating(true);
        try {
            const results = await validateUniqueLinksAction(activity.id);
            setValidationResults(results);
            setValidationDialogOpen(true);
        } catch (error: any) {
            toast.error("Error", {
                description: error.message || "No se pudo validar los enlaces.",
            });
        } finally {
            setIsValidating(false);
        }
    };

    // Prepare data for export
    const exportData = useMemo(() => {
        return studentStatus.map(({ student, submission, status }) => ({
            'Estudiante': student.name,
            'Email': student.email,
            'Estado': status === 'pending' ? 'Pendiente' : status === 'submitted' ? 'Entregado' : 'Calificado',
            'Fecha de Entrega': submission ? formatDateForExport(submission.lastSubmittedAt || submission.createdAt) : '-',
            'Intentos': submission ? `${submission.attemptCount} / ${activity.maxAttempts}` : '-',
            'Calificación': formatGradeForExport(submission?.grade),
            'URL de Entrega': submission?.url || '-'
        }));
    }, [studentStatus, activity.maxAttempts]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/teacher/courses/${activity.courseId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight">{activity.title}</h2>
                        <Badge variant="outline">{activity.type}</Badge>
                        <Badge variant="secondary">Peso: {activity.weight.toFixed(1)}%</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {activity.type !== "MANUAL" && `Vence: ${format(new Date(activity.deadline), "PP p")}`}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="instructions" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Instrucciones
                    </TabsTrigger>
                    <TabsTrigger value="statement" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Enunciado
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Resultados por Estudiantes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="space-y-4 mt-6">
                    <div data-color-mode={mode} className="rounded-md border p-6 bg-card">
                        <h3 className="text-lg font-semibold mb-4">Instrucciones de la Actividad</h3>
                        <MDEditor.Markdown
                            source={activity.description || "**No hay instrucciones disponibles.**"}
                            style={{ background: 'transparent' }}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="statement" className="space-y-4 mt-6">
                    <div data-color-mode={mode} className="rounded-md border p-6 bg-card">
                        <h3 className="text-lg font-semibold mb-4">Enunciado / Rúbrica de Evaluación</h3>
                        <MDEditor.Markdown
                            source={activity.statement || "**No hay enunciado/rúbrica disponible.**"}
                            style={{ background: 'transparent' }}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="text-2xl font-bold">{students.length}</div>
                            <p className="text-xs text-muted-foreground">Total Estudiantes</p>
                        </div>
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="text-2xl font-bold">
                                {studentStatus.filter(s => s.status !== "pending").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Entregas Recibidas</p>
                        </div>
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                            <div className="text-2xl font-bold">
                                {studentStatus.filter(s => s.status === "graded").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Calificados</p>
                        </div>
                    </div>

                    {/* Export and Validate Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={handleValidateLinks}
                            disabled={isValidating || activity.submissions.length === 0}
                            variant="outline"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            {isValidating ? "Validando..." : "Validar Enlaces Únicos"}
                        </Button>
                        <ExportButton
                            data={exportData}
                            filename={`${activity.title.replace(/\s+/g, '_')}_Calificaciones`}
                            sheetName="Calificaciones"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Estado</TableHead>
                                    {activity.type !== "MANUAL" && (
                                        <>
                                            <TableHead>Fecha Entrega</TableHead>
                                            <TableHead>Intentos</TableHead>
                                        </>
                                    )}
                                    <TableHead>Calificación</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentStatus.map(({ student, submission, status }) => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{student.name}</span>
                                                <span className="text-xs text-muted-foreground">{student.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {status === "pending" && <Badge variant="outline">Pendiente</Badge>}
                                            {status === "submitted" && <Badge variant="secondary">Entregado</Badge>}
                                            {status === "graded" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Calificado</Badge>}
                                        </TableCell>
                                        {activity.type !== "MANUAL" && (
                                            <>
                                                <TableCell>
                                                    {submission ? format(new Date(submission.lastSubmittedAt || submission.createdAt), "PP p") : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {submission ? (
                                                        <span className="text-sm">
                                                            {submission.attemptCount} / {activity.maxAttempts}
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            {submission?.grade !== null && submission?.grade !== undefined ? (
                                                <span className="font-bold">{submission.grade.toFixed(1)} / 5.0</span>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(submission || activity.type === "MANUAL") && (
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                {activity.type === "MANUAL" && !submission ? "Calificar" : "Ver Detalle"}
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent side="right" className="w-screen max-w-none sm:max-w-none p-0">
                                                            <SheetHeader className="px-6 py-4 border-b">
                                                                <SheetTitle>Detalle de Entrega</SheetTitle>
                                                                <SheetDescription>
                                                                    Estudiante: {student.name} ({student.email})
                                                                </SheetDescription>
                                                            </SheetHeader>

                                                            <div className="overflow-y-auto p-6 space-y-6">
                                                                {/* Student Info Card */}
                                                                <div className="rounded-lg border p-4 bg-muted/50">
                                                                    <h4 className="font-semibold mb-3">Información del Estudiante</h4>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Nombre:</span>
                                                                            <span className="font-medium">{student.name}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Email:</span>
                                                                            <span className="font-medium">{student.email}</span>
                                                                        </div>
                                                                        {submission && (
                                                                            <>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Intentos:</span>
                                                                                    <span className="font-medium">{submission.attemptCount} / {activity.maxAttempts}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Última entrega:</span>
                                                                                    <span className="font-medium">
                                                                                        {format(new Date(submission.lastSubmittedAt || submission.createdAt), "PPp")}
                                                                                    </span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>


                                                                {/* Submission URL */}
                                                                {submission && submission.url && (
                                                                    <div className="rounded-lg border p-4">
                                                                        <h4 className="font-semibold mb-3">Enlace de Entrega</h4>
                                                                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                                                            {activity.type === "GITHUB" ? (
                                                                                <Github className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                                            ) : activity.type === "GOOGLE_COLAB" ? (
                                                                                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                                            ) : (
                                                                                <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                                            )}
                                                                            <a
                                                                                href={submission.url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-blue-600 hover:underline font-medium text-sm break-all"
                                                                            >
                                                                                {activity.type === "GITHUB" ? "Ver Repositorio en GitHub" :
                                                                                    activity.type === "GOOGLE_COLAB" ? "Ver Notebook en Google Colab" :
                                                                                        submission.url}
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Grade */}
                                                                {submission && submission.grade !== null && (
                                                                    <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                                                                        <h4 className="font-semibold mb-3">Calificación</h4>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-muted-foreground">Nota obtenida:</span>
                                                                            <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                                                                                {submission.grade.toFixed(1)} / 5.0
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Feedback */}
                                                                {submission && submission.feedback && (
                                                                    <div className="rounded-lg border p-4">
                                                                        <h4 className="font-semibold mb-3">Retroalimentación</h4>
                                                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                                                            <FeedbackViewer feedback={submission.feedback} />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Manual Grading Form */}
                                                                {activity.type === "MANUAL" && (
                                                                    <div className="rounded-lg border p-4 bg-muted/30">
                                                                        <h4 className="font-semibold mb-3">Calificación Manual</h4>
                                                                        <form action={async (formData) => {
                                                                            formData.append("activityId", activity.id);
                                                                            formData.append("userId", student.id);
                                                                            formData.append("courseId", activity.courseId);
                                                                            await import("@/app/actions").then(mod => mod.gradeManualActivityAction(formData));
                                                                            toast.success("Calificación guardada");
                                                                        }}>
                                                                            <div className="space-y-4">
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="grade">Nota (0.0 - 5.0)</Label>
                                                                                    <Input
                                                                                        id="grade"
                                                                                        name="grade"
                                                                                        type="number"
                                                                                        step="0.1"
                                                                                        min="0"
                                                                                        max="5"
                                                                                        defaultValue={submission?.grade ?? ""}
                                                                                        required
                                                                                        placeholder="Ej: 4.5"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <Label htmlFor="feedback">Retroalimentación</Label>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                                            onClick={async () => {
                                                                                                const textarea = document.getElementById('feedback') as HTMLTextAreaElement;
                                                                                                const text = textarea.value;
                                                                                                if (!text || text.length < 10) {
                                                                                                    toast.error("Escribe al menos 10 caracteres para mejorar.");
                                                                                                    return;
                                                                                                }

                                                                                                const toastId = toast.loading("Mejorando redacción con IA...");
                                                                                                try {
                                                                                                    const { improveFeedbackAction } = await import("@/app/actions");
                                                                                                    const improved = await improveFeedbackAction(text);
                                                                                                    textarea.value = improved;
                                                                                                    toast.success("Texto mejorado", { id: toastId });
                                                                                                } catch (error) {
                                                                                                    toast.error("Error al mejorar texto", { id: toastId });
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                                                            Mejorar con IA
                                                                                        </Button>
                                                                                    </div>
                                                                                    <Textarea
                                                                                        id="feedback"
                                                                                        name="feedback"
                                                                                        defaultValue={submission?.feedback ?? ""}
                                                                                        placeholder="Comentarios para el estudiante..."
                                                                                        rows={4}
                                                                                    />
                                                                                </div>
                                                                                <Button type="submit" className="w-full">
                                                                                    {submission ? "Actualizar Nota" : "Guardar Nota"}
                                                                                </Button>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                )}

                                                                {/* No Submission Yet */}
                                                                {!submission && activity.type !== "MANUAL" && (
                                                                    <div className="rounded-lg border border-dashed p-6 text-center">
                                                                        <p className="text-muted-foreground">
                                                                            El estudiante aún no ha realizado ninguna entrega.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>
                                                )}
                                                {submission && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSubmission(submission)}
                                                        disabled={isPending}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {studentStatus.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No hay estudiantes inscritos en este curso.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Validation Results Dialog */}
            <AlertDialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
                <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Análisis de Enlaces Únicos
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Resultados de la validación de enlaces en las entregas de los estudiantes
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {validationResults && (
                        <div className="space-y-6 py-4">
                            {/* Statistics Cards */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="rounded-lg border p-4 bg-card">
                                    <div className="text-2xl font-bold">{validationResults.totalSubmissions}</div>
                                    <p className="text-xs text-muted-foreground">Total Entregas</p>
                                </div>
                                <div className="rounded-lg border p-4 bg-card">
                                    <div className="text-2xl font-bold text-green-600">{validationResults.uniqueCount}</div>
                                    <p className="text-xs text-muted-foreground">Enlaces Únicos</p>
                                </div>
                                <div className="rounded-lg border p-4 bg-card">
                                    <div className="text-2xl font-bold text-red-600">{validationResults.duplicateCount}</div>
                                    <p className="text-xs text-muted-foreground">Enlaces Duplicados</p>
                                </div>
                                <div className="rounded-lg border p-4 bg-card">
                                    <div className="text-2xl font-bold text-blue-600">{validationResults.originalityPercentage}%</div>
                                    <p className="text-xs text-muted-foreground">Originalidad</p>
                                </div>
                            </div>

                            {/* Duplicates List */}
                            {validationResults.duplicates.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        <span>Enlaces Duplicados Detectados ({validationResults.duplicates.length})</span>
                                    </div>

                                    {validationResults.duplicates.map((duplicate: any, index: number) => (
                                        <div key={index} className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <Badge variant="destructive" className="mt-1">
                                                    {duplicate.count} estudiantes
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="text-sm font-mono text-muted-foreground break-all">
                                                        {duplicate.url}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pl-4 border-l-2 border-red-300">
                                                {duplicate.students.map((student: any) => (
                                                    <div key={student.id} className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <span className="font-medium">{student.name}</span>
                                                            <span className="text-muted-foreground ml-2">({student.email})</span>
                                                        </div>
                                                        {student.originalUrl !== duplicate.url && (
                                                            <Badge variant="outline" className="text-xs">
                                                                URL original diferente
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-6 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                    <p className="font-semibold text-green-800 dark:text-green-400">
                                        ¡Excelente! No se detectaron enlaces duplicados
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Todos los estudiantes entregaron enlaces únicos
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setValidationDialogOpen(false)}>
                            Cerrar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar entrega?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la entrega del estudiante
                            {submissionToDelete && ` (${submissionToDelete.user?.name || 'estudiante'})`}.
                            <br /><br />
                            <strong>Nota:</strong> Al eliminar la entrega, se reiniciará el contador de intentos del estudiante, permitiéndole volver a entregar como si fuera la primera vez.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
