"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCatalog } from "./CourseCatalog";
import { MyEnrollments } from "./MyEnrollments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StudentDashboard({
    availableCourses,
    myEnrollments,
    studentName,
    pendingEnrollments = []
}: {
    availableCourses: any[],
    myEnrollments: any[],
    studentName: string,
    pendingEnrollments?: string[]
}) {
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    const handleSelectCourse = (courseId: string | null) => {
        setSelectedCourse(courseId || "");
    };

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">¡Hola, {studentName.split(' ')[0]}!</h1>
                <p className="text-muted-foreground">
                    Aquí tienes un resumen de tu actividad académica en SmartClass.
                </p>
            </div>

            {/* Resumen Semanal / Widgets Rápidos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximos Vencimientos */}
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Tareas Próximas</CardTitle>
                        <Calendar className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const now = new Date();
                            const limit = addDays(now, 3);
                            const upcomingTasks = myEnrollments
                                .flatMap(e => e.course.activities.map((a: any) => ({ ...a, courseTitle: e.course.title })))
                                .filter(a => a.deadline && isAfter(new Date(a.deadline), now) && isBefore(new Date(a.deadline), limit) && a.submissions.length === 0)
                                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                                .slice(0, 2);

                            if (upcomingTasks.length === 0) {
                                return <p className="text-xs text-muted-foreground">No tienes tareas pendientes para los próximos 3 días. ¡Buen trabajo!</p>;
                            }

                            return (
                                <div className="space-y-3">
                                    {upcomingTasks.map(task => (
                                        <div key={task.id} className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-medium truncate max-w-[150px]">{task.title}</span>
                                                <Badge variant="outline" className="text-[10px] py-0 border-amber-200 text-amber-700 bg-amber-50 shrink-0">
                                                    {format(new Date(task.deadline), "eeee", { locale: es })}
                                                </Badge>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate">{task.courseTitle}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Últimas Calificaciones */}
                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Notas Recientes</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const latestGrades = myEnrollments
                                .flatMap(e => e.course.activities.flatMap((a: any) => 
                                    a.submissions
                                        .filter((s: any) => s.grade !== null)
                                        .map((s: any) => ({ ...s, activityTitle: a.title, courseTitle: e.course.title }))
                                ))
                                .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                                .slice(0, 2);

                            if (latestGrades.length === 0) {
                                return <p className="text-xs text-muted-foreground">Aún no tienes calificaciones nuevas.</p>;
                            }

                            return (
                                <div className="space-y-3">
                                    {latestGrades.map(grade => (
                                        <div key={grade.id} className="flex items-center justify-between gap-2">
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <span className="text-xs font-medium truncate">{grade.activityTitle}</span>
                                                <span className="text-[10px] text-muted-foreground truncate">{grade.courseTitle}</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600 shrink-0">{grade.grade.toFixed(1)}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Resumen de Asistencia */}
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Cursos Inscritos</CardTitle>
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{myEnrollments.length}</span>
                            <span className="text-sm text-muted-foreground">cursos activos</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Entregas totales: {myEnrollments.reduce((acc, e) => acc + e.course.activities.reduce((a: number, act: any) => a + act.submissions.length, 0), 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {pendingEnrollments.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
                    Tienes {pendingEnrollments.length} solicitud{pendingEnrollments.length !== 1 ? 'es' : ''} de inscripción pendiente{pendingEnrollments.length !== 1 ? 's' : ''} de aprobación por el profesor.
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="my-courses" className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                        <TabsTrigger value="my-courses">Mis Cursos</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo de Cursos</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="my-courses" className="space-y-6 mt-0">
                    <MyEnrollments
                        enrollments={myEnrollments}
                        selectedCourse={selectedCourse}
                        onSelectCourse={handleSelectCourse}
                    />
                </TabsContent>
                <TabsContent value="catalog" className="space-y-6 mt-0">
                    <CourseCatalog
                        courses={availableCourses.filter(course =>
                            !myEnrollments.some(enrollment => enrollment.courseId === course.id) &&
                            (!course.endDate || new Date(course.endDate) >= new Date()) &&
                            course.registrationOpen &&
                            (!course.registrationDeadline || new Date(course.registrationDeadline) >= new Date())
                        )}
                        pendingEnrollments={pendingEnrollments}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
