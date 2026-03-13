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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertCircle, ExternalLink, ArrowRight, BookOpen, ClipboardCheck, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { StudentAttendanceSummary } from "@/features/attendance/components/StudentAttendanceSummary";
import { Badge } from "@/components/ui/badge";
import { StudentRemarks } from "./StudentRemarks";
import { SharedContentList } from "./components/SharedContentList";

export function MyEnrollments({ enrollments, selectedCourse }: { enrollments: any[], selectedCourse?: string }) {
    // Filter enrollments by selected course
    const filteredEnrollments = selectedCourse
        ? enrollments.filter(e => e.course.id === selectedCourse)
        : enrollments;

    return (
        <div className="space-y-6">

            {filteredEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden border-muted">
                    <CardHeader className="py-2 px-4 border-b bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="space-y-0.5">
                                <CardTitle className="text-xl font-bold">{enrollment.course.title}</CardTitle>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    Profesor: {enrollment.course.teacher.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {enrollment.course.externalUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="h-8"
                                    >
                                        <Link href={enrollment.course.externalUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                            Documentación
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 min-w-0">
                        <Tabs defaultValue="activities" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                                <TabsTrigger value="activities" className="gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span className="hidden sm:inline">Actividades Pendientes y Entregas</span>
                                    <span className="sm:hidden text-xs">Actividades</span>
                                </TabsTrigger>
                                <TabsTrigger value="attendance" className="gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="hidden sm:inline">Historial de Inasistencias</span>
                                    <span className="sm:hidden text-xs">Asistencia</span>
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="hidden sm:inline">Recursos Compartidos</span>
                                    <span className="sm:hidden text-xs">Recursos</span>
                                </TabsTrigger>
                                <TabsTrigger value="remarks" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="hidden sm:inline">Observaciones Estudiante</span>
                                    <span className="sm:hidden text-xs">Obs.</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="activities" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        Actividades Pendientes y Entregas
                                    </h3>
                                    {enrollment.course.activities.length > 0 ? (
                                        <div className="w-full overflow-x-auto rounded-md border">
                                            <Table className="min-w-[700px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[300px]">Actividad</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Nota</TableHead>
                                                        <TableHead className="hidden md:table-cell">Vencimiento</TableHead>
                                                        <TableHead className="text-right">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {enrollment.course.activities.map((activity: any, index: number) => {
                                                        const submission = activity.submissions[0];
                                                        const isSubmitted = !!submission;
                                                        const isGraded = submission && submission.grade !== null;
                                                        const isRejected = submission && submission.grade === null && submission.feedback && submission.feedback.includes("[ENTREGA RECHAZADA]");
                                                        const isOpen = !activity.openDate || new Date() >= new Date(activity.openDate);

                                                        return (
                                                            <TableRow key={activity.id} suppressHydrationWarning>
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
                                                                <TableCell suppressHydrationWarning>
                                                                    {!isOpen ? (
                                                                        <Badge variant="secondary">Bloqueado</Badge>
                                                                    ) : isGraded ? (
                                                                        <Badge variant="success">Calificado</Badge>
                                                                    ) : isRejected ? (
                                                                        <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-transparent gap-1">
                                                                            <AlertCircle className="h-3 w-3" /> Rechazado
                                                                        </Badge>
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
                                                                <TableCell className="hidden sm:table-cell" suppressHydrationWarning>
                                                                    {isGraded ? (
                                                                        <span className="font-bold text-primary">
                                                                            {submission.grade.toFixed(1)}
                                                                        </span>
                                                                    ) : !isSubmitted && activity.deadline && new Date(activity.deadline) < new Date() && activity.type !== 'MANUAL' ? (
                                                                        <span className="font-bold text-red-500">0.0</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="hidden md:table-cell" suppressHydrationWarning>
                                                                    <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                                                        {activity.type === "MANUAL" ? "-" : format(new Date(activity.deadline), "PP", { locale: es })}
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
                            </TabsContent>

                            <TabsContent value="attendance" className="space-y-4 pt-4">
                                <StudentAttendanceSummary courseId={enrollment.course.id} userId={enrollment.userId} />
                            </TabsContent>

                            <TabsContent value="resources" className="space-y-4 pt-4 min-w-0 w-full overflow-hidden">
                                <SharedContentList contents={enrollment.course.sharedContent || []} />
                            </TabsContent>

                            <TabsContent value="remarks" className="space-y-4 pt-4">
                                <StudentRemarks courseId={enrollment.course.id} userId={enrollment.userId} />
                            </TabsContent>
                        </Tabs>
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
