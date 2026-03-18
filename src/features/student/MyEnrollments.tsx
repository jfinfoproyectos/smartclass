"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Clock, 
    AlertCircle, 
    ExternalLink, 
    ArrowRight, 
    BookOpen, 
    ClipboardCheck, 
    MessageSquare, 
    Users, 
    ArrowLeft, 
    Calendar,
    GraduationCap,
    BookMarked,
    Laptop,
    FileText
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { StudentAttendanceSummary } from "@/features/attendance/components/StudentAttendanceSummary";
import { Badge } from "@/components/ui/badge";
import { StudentRemarks } from "./StudentRemarks";
import { SharedContentList } from "./components/SharedContentList";
import { StudentGradesView } from "./components/StudentGradesView";
import { GlareCard } from "@/components/ui/aceternity/glare-card";
import { formatName } from "@/lib/utils";

export function MyEnrollments({ enrollments, selectedCourse, onSelectCourse }: { enrollments: any[], selectedCourse?: string, onSelectCourse?: (id: string | null) => void }) {
    // Filter enrollments by selected course
    const filteredEnrollments = selectedCourse
        ? enrollments.filter(e => e.course.id === selectedCourse)
        : enrollments;

    if (!selectedCourse) {
        if (enrollments.length === 0) {
            return (
                <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                    No estás inscrito en ningún curso. Ve al catálogo para inscribirte.
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {enrollments.map((enrollment, index) => {
                    // Seleccionar un color o gradiente aleatorio/predefinido según el índice
                    const gradients = [
                        "from-blue-500/10 to-transparent",
                        "from-purple-500/10 to-transparent",
                        "from-emerald-500/10 to-transparent",
                        "from-amber-500/10 to-transparent",
                        "from-rose-500/10 to-transparent",
                        "from-cyan-500/10 to-transparent",
                    ];
                    
                    const icons = [
                        <GraduationCap className="h-8 w-8 text-primary/70" key="cap" />,
                        <BookOpen className="h-8 w-8 text-primary/70" key="book1" />,
                        <BookMarked className="h-8 w-8 text-primary/70" key="book2" />,
                        <Laptop className="h-8 w-8 text-primary/70" key="lap" />,
                        <ClipboardCheck className="h-8 w-8 text-primary/70" key="clip" />
                    ];

                    const bgGradient = gradients[index % gradients.length];
                    const Icon = icons[index % icons.length];

                    return (
                        <GlareCard key={enrollment.id} className="flex flex-col relative overflow-hidden group hover:shadow-lg transition-all rounded-xl border border-muted/50 h-[210px]">
                            <div 
                                onClick={() => onSelectCourse?.(enrollment.course.id)}
                                className={`flex-grow flex flex-col z-10 cursor-pointer h-full bg-gradient-to-br ${bgGradient}`}
                            >
                                <CardHeader className="pb-2 pt-6 px-6">
                                    <div className="mb-4 bg-background/50 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border shadow-sm">
                                        {Icon}
                                    </div>
                                    <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[3rem]" title={enrollment.course.title}>
                                        {enrollment.course.title}
                                    </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="flex-grow flex flex-col justify-between pb-6 px-6">
                                    <div className="flex flex-col gap-2 text-sm flex-grow">
                                        <div className="pt-2 mt-2 border-t flex items-center gap-2 text-muted-foreground font-medium">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="truncate">Prof: {formatName(enrollment.course.teacher.name, enrollment.course.teacher.profile)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </GlareCard>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {onSelectCourse && (
                <Button 
                    variant="outline" 
                    size="sm"
                    className="mb-2 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm" 
                    onClick={() => onSelectCourse(null)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a mis cursos
                </Button>
            )}

            {filteredEnrollments.map((enrollment) => {
                const totalActivities = enrollment.course.activities.length;
                const submittedActivities = enrollment.course.activities.filter((a: any) => a.submissions.length > 0).length;
                const progressPercentage = totalActivities > 0 ? Math.round((submittedActivities / totalActivities) * 100) : 0;

                return (
                    <Card key={enrollment.id} className="overflow-hidden border-muted shadow-sm">
                        <CardHeader className="py-4 px-6 border-b bg-muted/30">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1.5 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-2xl font-bold">{enrollment.course.title}</CardTitle>
                                        <Badge variant="secondary" className="font-semibold px-2 py-0 h-6">
                                            {progressPercentage}% completado
                                        </Badge>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground gap-3">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            Prof: {formatName(enrollment.course.teacher.name, enrollment.course.teacher.profile)}
                                        </span>
                                        {enrollment.course.activities.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <ClipboardCheck className="h-3.5 w-3.5" />
                                                {submittedActivities}/{totalActivities} actividades
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full max-w-md h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all duration-500 ease-out" 
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {enrollment.course.externalUrl && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            asChild
                                            className="h-9 shadow-sm"
                                        >
                                            <Link href={enrollment.course.externalUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Documentación
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    <CardContent className="pt-6 min-w-0">
                        <Tabs defaultValue="activities" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1">
                                <TabsTrigger value="activities" className="gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span className="hidden sm:inline">Actividades</span>
                                    <span className="sm:hidden text-xs">Actividades</span>
                                </TabsTrigger>
                                <TabsTrigger value="evaluations" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="hidden sm:inline">Evaluaciones</span>
                                    <span className="sm:hidden text-xs">Evaluaciones</span>
                                </TabsTrigger>
                                <TabsTrigger value="grades" className="gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    <span className="hidden sm:inline">Calificaciones</span>
                                    <span className="sm:hidden text-xs">Calificaciones</span>
                                </TabsTrigger>
                                <TabsTrigger value="remarks" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="hidden sm:inline">Observaciones</span>
                                    <span className="sm:hidden text-xs">Observaciones</span>
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="hidden sm:inline">Recursos</span>
                                    <span className="sm:hidden text-xs">Recursos</span>
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
                                                            <TableRow key={activity.id} suppressHydrationWarning className="hover:bg-muted/30 transition-colors">
                                                                <TableCell className="font-medium py-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                                            {index + 1}
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="font-bold text-sm sm:text-base">{activity.title}</div>
                                                                            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-2">
                                                                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] font-normal">
                                                                                    Peso: {activity.weight.toFixed(1)}%
                                                                                </Badge>
                                                                                {activity.type === "MANUAL" && <span>• Manual</span>}
                                                                            </div>
                                                                            {!isOpen && (
                                                                                <div className="text-[10px] text-amber-600 font-medium mt-1 flex items-center">
                                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                                    Disponible el: {format(new Date(activity.openDate), "PP p")}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell suppressHydrationWarning>
                                                                    {!isOpen ? (
                                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">Bloqueado</Badge>
                                                                    ) : isGraded ? (
                                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Completado</Badge>
                                                                    ) : isRejected ? (
                                                                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none gap-1">
                                                                            <AlertCircle className="h-3 w-3" /> Corregir
                                                                        </Badge>
                                                                    ) : isSubmitted ? (
                                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none gap-1">
                                                                            <Clock className="h-3 w-3" /> En Revisión
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none gap-1">
                                                                            <AlertCircle className="h-3 w-3" /> Pendiente
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="hidden sm:table-cell" suppressHydrationWarning>
                                                                    {isGraded ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-lg text-primary">
                                                                                {submission.grade.toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                    ) : !isSubmitted && activity.deadline && new Date(activity.deadline) < new Date() && activity.type !== 'MANUAL' ? (
                                                                        <span className="font-bold text-rose-500">0.0</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="hidden md:table-cell" suppressHydrationWarning>
                                                                    <div className="text-xs text-muted-foreground font-medium" suppressHydrationWarning>
                                                                        {activity.type === "MANUAL" ? (
                                                                            <span className="italic">Sin fecha límite</span>
                                                                        ) : (
                                                                            <span className={new Date(activity.deadline) < new Date() ? "text-rose-500" : ""}>
                                                                                {format(new Date(activity.deadline), "PP", { locale: es })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button 
                                                                        variant={!isOpen ? "ghost" : isSubmitted ? "secondary" : "default"} 
                                                                        size="sm" 
                                                                        asChild 
                                                                        disabled={!isOpen}
                                                                        className="shadow-sm"
                                                                    >
                                                                        {isOpen ? (
                                                                            <Link href={`/dashboard/student/activities/${activity.id}`}>
                                                                                {isSubmitted ? "Revisar" : "Abrir"}
                                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                                            </Link>
                                                                        ) : (
                                                                            <span className="text-muted-foreground cursor-not-allowed flex items-center justify-end text-xs">
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

                            <TabsContent value="evaluations" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        Evaluaciones del Curso
                                    </h3>
                                    {enrollment.course.evaluationAttempts?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {enrollment.course.evaluationAttempts.map((attempt: any) => {
                                                const submission = attempt.submissions[0];
                                                const isSubmitted = !!submission?.submittedAt;
                                                const now = new Date();
                                                const startTime = new Date(attempt.startTime);
                                                const endTime = new Date(attempt.endTime);
                                                const isOpen = now >= startTime && now <= endTime;
                                                const isUpcoming = now < startTime;
                                                const isExpired = now > endTime && !isSubmitted;

                                                return (
                                                    <Card key={attempt.id} className="overflow-hidden border-muted shadow-sm hover:shadow-md transition-shadow">
                                                        <CardHeader className="pb-3 border-b bg-muted/10">
                                                            <CardTitle className="text-lg">{attempt.evaluation.title}</CardTitle>
                                                            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                                                                <Clock className="h-3.5 w-3.5 text-primary" />
                                                                <span suppressHydrationWarning>
                                                                    {format(startTime, "PP p", { locale: es })}
                                                                </span>
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-4 flex flex-col gap-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Estado</span>
                                                                    {isSubmitted ? (
                                                                        <Badge className="bg-emerald-100 text-emerald-700 border-none">Completado</Badge>
                                                                    ) : isExpired ? (
                                                                        <Badge variant="destructive">Expirado</Badge>
                                                                    ) : isUpcoming ? (
                                                                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Próximamente</Badge>
                                                                    ) : isOpen ? (
                                                                        <Badge className="bg-blue-100 text-blue-700 border-none animate-pulse">Abierto</Badge>
                                                                    ) : null}
                                                                </div>
                                                                {isSubmitted && submission.score !== null && (
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nota</span>
                                                                        <span className="text-xl font-bold text-primary">{submission.score.toFixed(1)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button 
                                                                className="w-full font-bold shadow-sm" 
                                                                variant={isSubmitted ? "outline" : isOpen ? "default" : "secondary"}
                                                                disabled={!isOpen && !isSubmitted}
                                                                asChild
                                                            >
                                                                <Link href={`/evaluations/${attempt.id}`}>
                                                                    {isSubmitted ? "Ver Resultados" : isOpen ? "Realizar Evaluación" : "No disponible"}
                                                                </Link>
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
                                            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                            <p className="text-muted-foreground font-medium">No hay evaluaciones programadas para este curso.</p>
                                        </div>
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

                            <TabsContent value="grades" className="space-y-4 pt-4">
                                <StudentGradesView enrollment={enrollment} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                );
            })}
        </div>
    );
}
