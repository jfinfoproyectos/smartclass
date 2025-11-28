"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Clock, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useRef, useState, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { CourseReportTemplate } from "./CourseReportTemplate";
import { Printer } from "lucide-react";
import { StudentAttendanceSummary } from "@/features/attendance/components/StudentAttendanceSummary";
import { Badge } from "@/components/ui/badge";
import { StudentRemarks } from "./StudentRemarks";
import { ExportButton } from "@/components/ui/export-button";
import { formatDateForExport, formatGradeForExport } from "@/lib/export-utils";

export function MyEnrollments({ enrollments, studentName, selectedCourse }: { enrollments: any[], studentName: string, selectedCourse?: string }) {
    const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Filter enrollments by selected course
    const filteredEnrollments = selectedCourse
        ? enrollments.filter(e => e.course.id === selectedCourse)
        : enrollments;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Reporte_${selectedEnrollment?.course.title || "Curso"}`,
    });

    const onPrintClick = (enrollment: any) => {
        setSelectedEnrollment(enrollment);
        // Small timeout to allow state to update and render the hidden template
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    return (
        <div className="space-y-6">
            {/* Hidden Template for Printing */}
            <div style={{ display: "none" }}>
                {selectedEnrollment && (
                    <CourseReportTemplate
                        ref={printRef}
                        studentName={studentName}
                        courseName={selectedEnrollment.course.title}
                        teacherName={selectedEnrollment.course.teacher.name}
                        averageGrade={selectedEnrollment.averageGrade}
                        activities={selectedEnrollment.course.activities}
                        attendances={selectedEnrollment.attendances}
                        remarks={selectedEnrollment.remarks}
                    />
                )}
            </div>

            {filteredEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden border-muted">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold">{enrollment.course.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Profesor: {enrollment.course.teacher.name}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {enrollment.course.externalUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={enrollment.course.externalUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Documentación
                                        </Link>
                                    </Button>
                                )}
                                <ExportButton
                                    data={enrollment.course.activities.map((activity: any, index: number) => {
                                        const submission = activity.submissions[0];
                                        return {
                                            '#': index + 1,
                                            'Actividad': activity.title,
                                            'Peso': `${activity.weight.toFixed(1)}%`,
                                            'Estado': !activity.openDate || new Date() >= new Date(activity.openDate)
                                                ? (submission?.grade !== null ? 'Calificado' : submission ? 'Enviado' : 'Pendiente')
                                                : 'Bloqueado',
                                            'Fecha de Entrega': submission ? formatDateForExport(submission.lastSubmittedAt || submission.createdAt) : '-',
                                            'Calificación': formatGradeForExport(submission?.grade),
                                            'Vencimiento': activity.type !== 'MANUAL' ? formatDateForExport(activity.deadline) : '-'
                                        };
                                    })}
                                    filename={`${enrollment.course.title.replace(/\s+/g, '_')}_Mis_Calificaciones`}
                                    sheetName="Mis Calificaciones"
                                    variant="outline"
                                    size="sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPrintClick(enrollment)}
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Generar Reporte
                                </Button>
                                <div className="flex flex-col items-end bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                                    <div className="text-2xl font-bold text-primary">
                                        {enrollment.averageGrade > 0 ? enrollment.averageGrade.toFixed(1) : "-"}
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">Promedio Acumulado</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Activities Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                Actividades Pendientes y Entregas
                            </h3>
                            {enrollment.course.activities.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[300px]">Actividad</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Nota</TableHead>
                                                <TableHead>Vencimiento</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrollment.course.activities.map((activity: any, index: number) => {
                                                const submission = activity.submissions[0];
                                                const isSubmitted = !!submission;
                                                const isGraded = submission && submission.grade !== null;
                                                const isOpen = !activity.openDate || new Date() >= new Date(activity.openDate);

                                                return (
                                                    <TableRow key={activity.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold">{activity.title}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Peso: {activity.weight.toFixed(1)}%
                                                                    </div>
                                                                    {!isOpen && (
                                                                        <div className="text-xs text-amber-600 font-medium mt-1 flex items-center">
                                                                            <Clock className="mr-1 h-3 w-3" />
                                                                            Disponible el: {format(new Date(activity.openDate), "PP p")}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {!isOpen ? (
                                                                <Badge variant="secondary">Bloqueado</Badge>
                                                            ) : isGraded ? (
                                                                <Badge variant="success">Calificado</Badge>
                                                            ) : isSubmitted ? (
                                                                <Badge variant="warning" className="gap-1">
                                                                    <Clock className="h-3 w-3" /> Enviado
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive" className="gap-1">
                                                                    <AlertCircle className="h-3 w-3" /> Pendiente
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {isGraded ? (
                                                                <span className="font-bold text-primary">
                                                                    {submission.grade.toFixed(1)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm text-muted-foreground">
                                                                {activity.type === "MANUAL" ? "-" : format(new Date(activity.deadline), "PP")}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" asChild disabled={!isOpen}>
                                                                {isOpen ? (
                                                                    <Link href={`/dashboard/student/activities/${activity.id}`}>
                                                                        Ver Detalles
                                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-muted-foreground cursor-not-allowed flex items-center justify-end">
                                                                        Bloqueado
                                                                    </span>
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay actividades en este curso.</p>
                            )}
                        </div>

                        {/* Attendance Section */}
                        <StudentAttendanceSummary courseId={enrollment.course.id} userId={enrollment.userId} />

                        {/* Remarks Section */}
                        <StudentRemarks courseId={enrollment.course.id} userId={enrollment.userId} />
                    </CardContent>
                </Card>
            ))}
            {filteredEnrollments.length === 0 && enrollments.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No estás inscrito en ningún curso. Ve al catálogo para inscribirte.
                </div>
            )}
        </div>
    );
}
