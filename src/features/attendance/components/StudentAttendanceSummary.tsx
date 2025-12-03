"use client";

import { useEffect, useState } from "react";
import { getStudentAttendanceStatsAction, registerLateArrivalAction, registerAbsenceJustificationAction, deleteAttendanceRecordAction } from "@/app/actions";
import { AlertCircle, Clock, CheckCircle, ExternalLink, Trash2, Eye } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

interface StudentAttendanceSummaryProps {
    courseId: string;
    userId: string;
    readonly?: boolean;
}

export function StudentAttendanceSummary({ courseId, userId, readonly = false }: StudentAttendanceSummaryProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Form states
    const [justificationType, setJustificationType] = useState<"LATE" | "WITH_SUPPORT" | "WITHOUT_SUPPORT">("LATE");
    const [code, setCode] = useState("");
    const [justification, setJustification] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<any | null>(null);

    const fetchStats = async () => {
        try {
            const data = await getStudentAttendanceStatsAction(courseId, userId);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch attendance stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [courseId, userId]);

    const handleOpenDialog = (date: Date) => {
        setSelectedDate(date);

        // Check if the selected date is today
        const today = new Date();
        const isToday = new Date(date).toLocaleDateString() === today.toLocaleDateString();

        // Only allow LATE if it's today, otherwise default to WITH_SUPPORT
        setJustificationType(isToday ? "LATE" : "WITH_SUPPORT");

        setCode("");
        setJustification("");
        setDocumentUrl("");
        setIsDialogOpen(true);
    };

    const handleViewJustification = (record: any) => {
        setSelectedRecord(record);
        setIsViewDialogOpen(true);
    };

    const handleJustify = async () => {
        if (justificationType === "LATE") {
            if (!code || !justification) {
                toast.error("Por favor completa todos los campos");
                return;
            }
        } else if (justificationType === "WITH_SUPPORT") {
            if (!documentUrl || !justification) {
                toast.error("Por favor completa todos los campos");
                return;
            }
        } else {
            if (!justification) {
                toast.error("Por favor escribe una justificación");
                return;
            }
        }

        setSubmitting(true);
        try {
            if (justificationType === "LATE") {
                await registerLateArrivalAction(courseId, code, justification);
                toast.success("Llegada tarde registrada exitosamente");
            } else {
                if (!selectedDate) return;
                await registerAbsenceJustificationAction(courseId, selectedDate, documentUrl || null, justification);
                toast.success("Inasistencia justificada exitosamente");
            }

            setIsDialogOpen(false);
            fetchStats(); // Refresh stats
        } catch (error: any) {
            toast.error(error.message || "Error al registrar justificación");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (record: any) => {
        setRecordToDelete(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;

        try {
            await deleteAttendanceRecordAction(recordToDelete.id, courseId);
            toast.success("Registro de asistencia eliminado exitosamente");
            fetchStats();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar registro");
        } finally {
            setIsDeleteDialogOpen(false);
            setRecordToDelete(null);
        }
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Cargando asistencia...</div>;
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Historial de Inasistencias
                </h4>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Detalle</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.records.filter((r: any) => r.status === "ABSENT" || r.status === "LATE" || r.status === "EXCUSED").length > 0 ? (
                            stats.records
                                .filter((r: any) => r.status === "ABSENT" || r.status === "LATE" || r.status === "EXCUSED")
                                .map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {record.status === "ABSENT" ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Ausente
                                                </Badge>
                                            ) : record.status === "LATE" ? (
                                                <Badge variant="warning" className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                                                    <Clock className="h-3 w-3" /> Tarde
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                                                    <CheckCircle className="h-3 w-3" /> Excusado
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {record.status === "LATE" && record.arrivalTime ? (
                                                <span>Llegada: {new Date(record.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            ) : record.status === "EXCUSED" ? (
                                                <span className="font-medium">
                                                    {record.justificationUrl ? "Justificado con soporte" : "Justificado sin soporte"}
                                                </span>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!readonly && record.status === "ABSENT" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(new Date(record.date))}
                                                >
                                                    Justificar
                                                </Button>
                                            )}
                                            {/* Show View button for students if justified */}
                                            {!readonly && (record.status === "LATE" || record.status === "EXCUSED") && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewJustification(record)}
                                                >
                                                    Ver Justificación
                                                </Button>
                                            )}
                                            {/* Teacher view: Show view and delete for all records */}
                                            {readonly && (
                                                <div className="flex justify-end gap-2">
                                                    {(record.status === "LATE" || record.status === "EXCUSED") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleViewJustification(record)}
                                                            title="Ver Justificación"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteClick(record)}
                                                        title="Eliminar Registro"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                    ¡Excelente! No tienes inasistencias ni llegadas tarde registradas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Justificar Inasistencia</DialogTitle>
                        <DialogDescription>
                            Selecciona el tipo de justificación para la fecha {selectedDate?.toLocaleDateString()}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <div className="shrink-0">
                                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Nota: Una vez registrada la justificación, no podrás modificarla ni eliminarla. Asegúrate de que la información sea correcta.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {(() => {
                                if (!selectedDate) return null;
                                const today = new Date();
                                const date = new Date(selectedDate);

                                // Compare dates using local string representation to avoid timezone issues
                                const isToday = date.toLocaleDateString() === today.toLocaleDateString();

                                if (!isToday) return null;

                                return (
                                    <Button
                                        type="button"
                                        variant={justificationType === "LATE" ? "default" : "outline"}
                                        onClick={() => setJustificationType("LATE")}
                                        className="text-xs h-auto py-2 px-1"
                                    >
                                        Llegada Tarde
                                    </Button>
                                );
                            })()}
                            <Button
                                type="button"
                                variant={justificationType === "WITH_SUPPORT" ? "default" : "outline"}
                                onClick={() => setJustificationType("WITH_SUPPORT")}
                                className="text-xs h-auto py-2 px-1"
                            >
                                Con Soporte
                            </Button>
                            <Button
                                type="button"
                                variant={justificationType === "WITHOUT_SUPPORT" ? "default" : "outline"}
                                onClick={() => setJustificationType("WITHOUT_SUPPORT")}
                                className="text-xs h-auto py-2 px-1"
                            >
                                Sin Soporte
                            </Button>
                        </div>

                        {justificationType === "LATE" && (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                                    <p>Para justificar una llegada tarde, necesitas el código temporal proporcionado por el profesor.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Código Temporal</Label>
                                    <Input
                                        id="code"
                                        placeholder="Ej: 123456"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {justificationType === "WITH_SUPPORT" && (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                                    <p>Adjunta un enlace a un documento de Google Drive (público) que soporte tu excusa (incapacidad, calamidad, etc.).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="documentUrl">Enlace al Documento (Google Drive/Docs)</Label>
                                    <Input
                                        id="documentUrl"
                                        placeholder="https://docs.google.com/..."
                                        value={documentUrl}
                                        onChange={(e) => setDocumentUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {justificationType === "WITHOUT_SUPPORT" && (
                            <div className="space-y-4">
                                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                                    <p>Estás justificando una inasistencia sin soporte documental. Esto quedará a criterio del profesor.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="justification">Justificación / Comentario</Label>
                            <Textarea
                                id="justification"
                                placeholder="Explica brevemente la razón..."
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Cancelar</Button>
                        <Button onClick={handleJustify} disabled={submitting}>
                            {submitting ? "Registrando..." : "Registrar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de Justificación</DialogTitle>
                        <DialogDescription>
                            Información registrada para la fecha {selectedRecord && new Date(selectedRecord.date).toLocaleDateString()}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <div className="p-2 bg-muted rounded-md font-medium">
                                {selectedRecord?.status === "LATE" ? "Llegada Tarde" : "Inasistencia Justificada"}
                            </div>
                        </div>

                        {selectedRecord?.status === "LATE" && (
                            <div className="space-y-2">
                                <Label>Hora de Llegada</Label>
                                <div className="p-2 bg-muted rounded-md">
                                    {selectedRecord?.arrivalTime ? new Date(selectedRecord.arrivalTime).toLocaleTimeString() : "-"}
                                </div>
                            </div>
                        )}

                        {selectedRecord?.status === "EXCUSED" && selectedRecord?.justificationUrl && (
                            <div className="space-y-2">
                                <Label>Documento de Soporte</Label>
                                <div className="p-2 bg-muted rounded-md">
                                    <a
                                        href={selectedRecord.justificationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Ver Documento
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Justificación del Estudiante</Label>
                            <div className="p-3 bg-muted rounded-md italic">
                                "{selectedRecord?.justification || "Sin justificación"}"
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará completamente el registro de asistencia del estudiante para esta fecha. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
