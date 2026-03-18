import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityManager } from "@/features/teacher/ActivityManager";
import { StudentManager } from "@/features/teacher/StudentManager";
import { activityService } from "@/services/activityService";
import { courseService } from "@/services/courseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Dices, Users, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Roulette } from "@/features/teacher/Roulette";
import { GroupGenerator } from "@/features/teacher/GroupGenerator";
import { GroupContentShare } from "@/features/teacher/components/GroupContentShare";
import { sharedContentService } from "@/services/sharedContentService";
import { evaluationService } from "@/services/evaluationService";
import { EvaluationAssignmentManager } from "@/features/teacher/EvaluationAssignmentManager";
import { GradesManager } from "@/features/teacher/GradesManager";
import { gradeService } from "@/services/gradeService";

import { AttendanceTaker } from "@/features/attendance/components/AttendanceTaker";

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
    const sharedContents = await sharedContentService.getByCourse(courseId);
    
    // Evaluaciones
    const evaluationAssignments = await evaluationService.getCourseEvaluationAttempts(courseId);
    const teacherEvaluations = await evaluationService.getTeacherEvaluations(session.user.id);
    const gradesData = await gradeService.getCourseGradesData(courseId);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <AttendanceTaker courseId={courseId} />
                </div>
            </div>

            <Tabs defaultValue="students" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1 items-center justify-start gap-1">
                        <TabsTrigger value="students">Estudiantes</TabsTrigger>
                        <TabsTrigger value="activities">Actividades</TabsTrigger>
                        <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
                        <TabsTrigger value="grades" className="gap-2">
                            <GraduationCap className="h-4 w-4 hidden sm:inline-block" />
                            Calificaciones
                        </TabsTrigger>

                        <TabsTrigger 
                            value="roulette" 
                            className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:data-[state=active]:bg-indigo-600"
                        >
                            <Dices className="h-4 w-4 hidden sm:inline-block" />
                            Ruleta
                        </TabsTrigger>
                        <TabsTrigger 
                            value="groups" 
                            className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:data-[state=active]:bg-indigo-600"
                        >
                            <Users className="h-4 w-4 hidden sm:inline-block" />
                            Grupos
                        </TabsTrigger>
                        <TabsTrigger 
                            value="share"
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:data-[state=active]:bg-indigo-600"
                        >
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
                    <StudentManager 
                        courseId={courseId} 
                        initialStudents={students} 
                        courseTitle={course.title}
                    />
                </TabsContent>
                <TabsContent value="roulette" className="space-y-4">
                    <Roulette students={students} courseId={courseId} />
                </TabsContent>
                <TabsContent value="groups" className="space-y-4">
                    <GroupGenerator students={students} />
                </TabsContent>
                <TabsContent value="evaluations" className="space-y-4">
                    <EvaluationAssignmentManager 
                        courseId={courseId}
                        attempts={evaluationAssignments}
                        teacherEvaluations={teacherEvaluations}
                    />
                </TabsContent>
                <TabsContent value="grades" className="space-y-4">
                    <GradesManager courseId={courseId} initialData={gradesData} courseTitle={course.title} />
                </TabsContent>
                <TabsContent value="share" className="space-y-4">
                    <GroupContentShare courseId={courseId} initialContent={sharedContents} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
