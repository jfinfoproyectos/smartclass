"use client";

import { CourseManager } from "./CourseManager";
import { EnrollmentRequests } from "./EnrollmentRequests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Users, 
    BookOpen, 
    ClipboardCheck, 
    Clock, 
    Sparkles, 
    Timer, 
    ArrowRight,
    GraduationCap,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TeacherDashboardProps {
    courses: any[];
    pendingEnrollments: any[];
    stats: {
        pendingEnrollmentsCount: number;
        pendingGradingCount: number;
        activeCoursesCount: number;
        totalStudentsCount: number;
        recentPendingGrading: any[];
    };
    currentDate?: string;
}

export function TeacherDashboard({ courses, pendingEnrollments, stats, currentDate }: TeacherDashboardProps) {
    return (
        <div className="flex-1 space-y-8 p-4 sm:p-6 md:p-8 pt-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Panel de Control
                </h2>
                <p className="text-muted-foreground">
                    Bienvenido, gestiona tus cursos y revisa el progreso de tus estudiantes.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Resumen General
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Mis Cursos ({courses.length})
                    </TabsTrigger>
                    <TabsTrigger value="enrollments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
                        Solicitudes
                        {stats.pendingEnrollmentsCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-1.5 h-4 min-w-[1rem] flex items-center justify-center text-[10px]">
                                {stats.pendingEnrollmentsCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                    {/* Estadísticas Rápidas */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                                <BookOpen className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeCoursesCount}</div>
                                <p className="text-xs text-muted-foreground">En el período actual</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                                <Users className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalStudentsCount}</div>
                                <p className="text-xs text-muted-foreground">Inscritos en tus cursos</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Por Calificar</CardTitle>
                                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pendingGradingCount}</div>
                                <p className="text-xs text-muted-foreground">Actividades pendientes</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md bg-gradient-to-br from-rose-500/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inscripciones</CardTitle>
                                <GraduationCap className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pendingEnrollmentsCount}</div>
                                <p className="text-xs text-muted-foreground">Pendientes de aprobación</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Actividades Pendientes de Calificación */}
                        <Card className="lg:col-span-4 shadow-lg border-muted/20">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    Entregas Recientes por Calificar
                                </CardTitle>
                                <CardDescription>
                                    Últimas 5 entregas que requieren tu revisión.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.recentPendingGrading.length > 0 ? (
                                        stats.recentPendingGrading.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group">
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.activityTitle} • <span className="font-medium">{item.courseTitle}</span>
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Hace {formatDistanceToNow(new Date(item.submittedAt), { locale: es })}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/teacher/courses/${item.courseId}/activities/${item.activityId}`}>
                                                        Calificar <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                            <div className="p-3 bg-emerald-500/10 rounded-full">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">¡Todo al día!</p>
                                                <p className="text-sm text-muted-foreground">No tienes entregas pendientes por calificar.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Herramientas Rápidas */}
                        <Card className="lg:col-span-3 shadow-lg border-muted/20">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Herramientas de Clase
                                </CardTitle>
                                <CardDescription>
                                    Utilidades rápidas para tus sesiones presenciales o virtuales.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-3">
                                <Button variant="outline" className="h-16 justify-start gap-4 border-dashed hover:border-primary hover:bg-primary/5 transition-all" asChild>
                                    <Link href="/dashboard/teacher/tools">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <Sparkles className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Ruleta Genérica</p>
                                            <p className="text-xs text-muted-foreground">Sortear temas o premios</p>
                                        </div>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-16 justify-start gap-4 border-dashed hover:border-primary hover:bg-primary/5 transition-all" asChild>
                                    <Link href="/dashboard/teacher/tools">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Timer className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Temporizador Visual</p>
                                            <p className="text-xs text-muted-foreground">Gestión de tiempos</p>
                                        </div>
                                    </Link>
                                </Button>
                                <Button variant="outline" className="h-16 justify-start gap-4 border-dashed hover:border-primary hover:bg-primary/5 transition-all" asChild>
                                    <Link href="/dashboard/teacher/schedule">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Clock className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Horario de Clases</p>
                                            <p className="text-xs text-muted-foreground">Consulta tu agenda semanal</p>
                                        </div>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="courses" className="animate-in fade-in duration-500">
                    <CourseManager initialCourses={courses} pendingEnrollments={pendingEnrollments} currentDate={currentDate} />
                </TabsContent>

                <TabsContent value="enrollments" className="animate-in fade-in duration-500">
                    <EnrollmentRequests requests={pendingEnrollments} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
