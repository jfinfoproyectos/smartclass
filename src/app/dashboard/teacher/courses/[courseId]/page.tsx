import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityManager } from "@/features/teacher/ActivityManager";
import { StudentManager } from "@/features/teacher/StudentManager";
import { activityService } from "@/services/activityService";
import { courseService } from "@/services/courseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Dices, Users, Timer, List, QrCode } from "lucide-react";
import Link from "next/link";
import { Roulette } from "@/features/teacher/Roulette";
import { GroupGenerator } from "@/features/teacher/GroupGenerator";
import { VisualTimer } from "@/features/teacher/VisualTimer";
import { VisualSchedule } from "@/features/teacher/VisualSchedule";
import { QuickShare } from "@/features/teacher/QuickShare";

import { AttendanceTaker } from "@/features/attendance/components/AttendanceTaker";
import { LateCodeGenerator } from "@/features/attendance/components/LateCodeGenerator";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "teacher") {
        redirect("/signin");
    }

    const { courseId } = await params;

    const course = await courseService.getCourseById(courseId);

    if (!course) {
        return <div>Curso no encontrado</div>;
    }

    // Verify ownership
    if (course.teacher.id !== session.user.id) {
        return <div>No tienes permiso para ver este curso</div>;
    }

    const activities = await activityService.getCourseActivities(courseId);
    const students = await courseService.getCourseStudents(courseId);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <LateCodeGenerator courseId={courseId} />
                    <AttendanceTaker courseId={courseId} />
                </div>
            </div>

            <Tabs defaultValue="activities" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
                        <TabsTrigger value="activities">Actividades</TabsTrigger>
                        <TabsTrigger value="students">Estudiantes</TabsTrigger>
                        <TabsTrigger value="roulette" className="gap-2">
                            <Dices className="h-4 w-4" />
                            Ruleta
                        </TabsTrigger>
                        <TabsTrigger value="groups" className="gap-2">
                            <Users className="h-4 w-4" />
                            Grupos
                        </TabsTrigger>
                        <TabsTrigger value="timer" className="gap-2">
                            <Timer className="h-4 w-4" />
                            Temporizador
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="gap-2">
                            <List className="h-4 w-4" />
                            Agenda
                        </TabsTrigger>
                        <TabsTrigger value="share" className="gap-2">
                            <QrCode className="h-4 w-4" />
                            Compartir
                        </TabsTrigger>
                    </TabsList>
                    {course.externalUrl && (
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                            <Link href={course.externalUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Documentación
                            </Link>
                        </Button>
                    )}
                </div>
                <TabsContent value="activities" className="space-y-4">
                    <ActivityManager courseId={courseId} activities={activities} />
                </TabsContent>
                <TabsContent value="students" className="space-y-4">
                    <StudentManager courseId={courseId} initialStudents={students} />
                </TabsContent>
                <TabsContent value="roulette" className="space-y-4">
                    <Roulette students={students} courseId={courseId} />
                </TabsContent>
                <TabsContent value="groups" className="space-y-4">
                    <GroupGenerator students={students} />
                </TabsContent>
                <TabsContent value="timer" className="space-y-4">
                    <VisualTimer />
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4">
                    <VisualSchedule />
                </TabsContent>
                <TabsContent value="share" className="space-y-4">
                    <QuickShare />
                </TabsContent>
            </Tabs>
        </div>
    );
}
