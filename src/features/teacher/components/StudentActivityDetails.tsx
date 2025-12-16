"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Printer, X, Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { CourseReportTemplate } from "@/features/student/CourseReportTemplate";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StudentAttendanceSummary } from "../../attendance/components/StudentAttendanceSummary";
import { RemarkManager } from "./RemarkManager";
import { getStudentRemarksAction, deleteRemarkAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning, Award, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ui/export-button";
import { formatDateForExport, formatGradeForExport } from "@/lib/export-utils";

interface StudentActivityDetailsProps {
    enrollment: any;
}

export function StudentActivityDetails({ enrollment }: StudentActivityDetailsProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [remarks, setRemarks] = useState<any[]>([]);
    const [loadingRemarks, setLoadingRemarks] = useState(true);
    const [viewingRemark, setViewingRemark] = useState<any | null>(null);
    const [isViewRemarkDialogOpen, setIsViewRemarkDialogOpen] = useState(false);
    const [editingRemark, setEditingRemark] = useState<any | null>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Reporte_${enrollment.user.name}_${enrollment.course.title}`,
        onAfterPrint: () => setIsPrinting(false),
    });

    const onPrintClick = () => {
        setIsPrinting(true);
        // Small timeout to allow state to update and render the hidden template
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    const [attendances, setAttendances] = useState<any[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);

    const fetchRemarks = async () => {
        console.log("StudentActivityDetails: fetchRemarks called for", enrollment.course.id, enrollment.user.id);
        setLoadingRemarks(true);
        try {
            const data = await getStudentRemarksAction(enrollment.course.id, enrollment.user.id);
            console.log("StudentActivityDetails: Fetched remarks:", data);
            setRemarks(data);
        } catch (error) {
            console.error("Failed to fetch remarks", error);
        } finally {
            setLoadingRemarks(false);
        }
    };

    const fetchAttendance = async () => {
        setLoadingAttendance(true);
        try {
            // We need to import this action. It returns { records: [...] } among other stats
            const { getStudentAttendanceStatsAction } = await import("@/app/actions");
            const data = await getStudentAttendanceStatsAction(enrollment.course.id, enrollment.user.id);
            setAttendances(data.records);
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    useEffect(() => {
        fetchRemarks();
        fetchAttendance();
    }, [enrollment.course.id, enrollment.user.id]);

    const handleDeleteRemark = async (remarkId: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta observación?")) {
            try {
                await deleteRemarkAction(remarkId, enrollment.course.id);
                toast.success("Observación eliminada");
                fetchRemarks();
            } catch (error: any) {
                toast.error(error.message || "Error al eliminar");
            }
        }
    };

    const handleViewRemark = (remark: any) => {
        setViewingRemark(remark);
        setIsViewRemarkDialogOpen(true);
    };

    const handleEditRemark = (remark: any) => {
        setEditingRemark(remark);
    };

    const handleCloseEdit = () => {
        setEditingRemark(null);
    };

    console.log("StudentActivityDetails - enrollment.user.id:", enrollment.user.id);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={enrollment.user.image} />
                        <AvatarFallback>{enrollment.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {enrollment.user.profile?.nombres && enrollment.user.profile?.apellido
                                ? `${enrollment.user.profile.nombres} ${enrollment.user.profile.apellido}`
                                : enrollment.user.name}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">{enrollment.user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pr-8">
                    <ExportButton
                        data={enrollment.course.activities.map((activity: any, index: number) => {
                            const submission = activity.submissions[0];
                            const isSubmitted = !!submission;
                            const isGraded = submission && submission.grade !== null;

                            return {
                                '#': index + 1,
                                'Actividad': activity.title,
                                'Peso': `${activity.weight.toFixed(1)}%`,
                                'Estado': isGraded ? 'Calificado' : isSubmitted ? 'Enviado' : 'Pendiente',
                                'Nota': isGraded ? formatGradeForExport(submission.grade) : (!submission && activity.deadline && new Date(activity.deadline) < new Date() && activity.type !== 'MANUAL') ? '0.0' : '-',
                                'Entregado': submission ? formatDateForExport(submission.createdAt) : '-'
                            };
                        })}
                        filename={`Calificaciones_${enrollment.user.name.replace(/\s+/g, '_')}_${enrollment.course.title.replace(/\s+/g, '_')}`}
                        sheetName="Calificaciones"
                    />
                    <Button variant="outline" size="sm" onClick={onPrintClick}>
                        <Printer className="mr-2 h-4 w-4" />
                        Generar Reporte
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Curso</p>
                        <p className="font-semibold">{enrollment.course.title}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Promedio Acumulado</p>
                        <p className="text-2xl font-bold text-primary">
                            {enrollment.averageGrade > 0 ? enrollment.averageGrade.toFixed(1) : "-"}
                        </p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Actividad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Nota</TableHead>
                                <TableHead>Entregado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrollment.course.activities.map((activity: any, index: number) => {
                                const submission = activity.submissions[0];
                                const isSubmitted = !!submission;
                                const isGraded = submission && submission.grade !== null;

                                return (
                                    <TableRow key={activity.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{activity.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Peso: {activity.weight.toFixed(1)}%
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isGraded ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    Calificado
                                                </span>
                                            ) : isSubmitted ? (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    Enviado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    Pendiente
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isGraded ? (
                                                <span className="font-bold text-primary">
                                                    {submission.grade.toFixed(1)}
                                                </span>
                                            ) : !submission && activity.deadline && new Date(activity.deadline) < new Date() && activity.type !== 'MANUAL' ? (
                                                <span className="font-bold text-red-500">0.0</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {submission ? format(new Date(submission.createdAt), "PP p") : "-"}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {enrollment.course.activities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hay actividades en este curso.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-8">
                    <StudentAttendanceSummary
                        courseId={enrollment.course.id}
                        userId={enrollment.user.id}
                        readonly={true}
                    />
                </div>

                {/* Remarks Section */}
                <div className="mt-8 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <MessageSquareWarning className="h-4 w-4" />
                                Llamados de Atención y Felicitaciones
                            </h4>
                            {!loadingRemarks && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {remarks.filter(r => r.type === "ATTENTION").length} atenciones, {remarks.filter(r => r.type === "COMMENDATION").length} felicitaciones
                                </p>
                            )}
                        </div>
                        <RemarkManager
                            courseId={enrollment.course.id}
                            userId={enrollment.user.id}
                            studentName={
                                enrollment.user.profile?.nombres && enrollment.user.profile?.apellido
                                    ? `${enrollment.user.profile.nombres} ${enrollment.user.profile.apellido}`
                                    : enrollment.user.name
                            }
                            onRemarkCreated={fetchRemarks}
                            editingRemark={editingRemark}
                            onClose={handleCloseEdit}
                        />
                    </div>

                    {loadingRemarks ? (
                        <div className="text-sm text-muted-foreground">Cargando observaciones...</div>
                    ) : remarks.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {remarks.map((remark) => (
                                        <TableRow key={remark.id}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(remark.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={remark.type === "ATTENTION" ? "destructive" : "default"}
                                                    className={remark.type === "COMMENDATION" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}
                                                >
                                                    {remark.type === "ATTENTION" ? (
                                                        <><MessageSquareWarning className="h-3 w-3 mr-1" /> Atención</>
                                                    ) : (
                                                        <><Award className="h-3 w-3 mr-1" /> Felicitación</>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{remark.title}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewRemark(remark)}
                                                        title="Ver descripción"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditRemark(remark)}
                                                        title="Editar observación"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteRemark(remark.id)}
                                                        title="Eliminar observación"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No hay observaciones registradas para este estudiante.
                        </div>
                    )}
                </div>
            </div>

            {/* View Remark Dialog */}
            <Dialog open={isViewRemarkDialogOpen} onOpenChange={setIsViewRemarkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de Observación</DialogTitle>
                        <DialogDescription>
                            {viewingRemark && new Date(viewingRemark.date).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <div className="p-2 bg-muted rounded-md">
                                <Badge
                                    variant={viewingRemark?.type === "ATTENTION" ? "destructive" : "default"}
                                    className={viewingRemark?.type === "COMMENDATION" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}
                                >
                                    {viewingRemark?.type === "ATTENTION" ? (
                                        <><MessageSquareWarning className="h-3 w-3 mr-1" /> Llamado de Atención</>
                                    ) : (
                                        <><Award className="h-3 w-3 mr-1" /> Felicitación</>
                                    )}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título</Label>
                            <div className="p-2 bg-muted rounded-md font-medium">
                                {viewingRemark?.title}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <div className="p-3 bg-muted rounded-md">
                                {viewingRemark?.description}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button onClick={() => setIsViewRemarkDialogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden Template for Printing */}
            <div style={{ display: "none" }}>
                <CourseReportTemplate
                    ref={printRef}
                    studentName={
                        enrollment.user.profile?.nombres && enrollment.user.profile?.apellido
                            ? `${enrollment.user.profile.nombres} ${enrollment.user.profile.apellido}`
                            : enrollment.user.name
                    }
                    courseName={enrollment.course.title}
                    teacherName={enrollment.course.teacher.name}
                    averageGrade={enrollment.averageGrade}
                    activities={enrollment.course.activities}
                    attendances={attendances}
                    remarks={remarks}
                />
            </div>
        </div>
    );
}
