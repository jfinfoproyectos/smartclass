import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityManager } from "@/features/teacher/ActivityManager";
import { StudentManager } from "@/features/teacher/StudentManager";
import { activityService } from "@/services/activityService";
import { courseService } from "@/services/courseService";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Roulette } from "@/features/teacher/Roulette";
import { GroupGenerator } from "@/features/teacher/GroupGenerator";
import { GroupContentShare } from "@/features/teacher/components/GroupContentShare";
import { sharedContentService } from "@/services/sharedContentService";
import { evaluationService } from "@/services/evaluationService";
import { EvaluationAssignmentManager } from "@/features/teacher/EvaluationAssignmentManager";
import { GradesManager } from "@/features/teacher/GradesManager";
import { gradeService } from "@/services/gradeService";
import { TeacherCourseHeader } from "@/features/teacher/components/TeacherCourseHeader";

import { CourseStatistics } from "@/features/teacher/components/CourseStatistics";
import { getCourseAttendanceReportAction } from "@/app/actions";
import { getAvailableThemes } from "@/app/actions/themes";

export default async function Page({ 
    params,
    searchParams 
}: { 
    params: Promise<{ courseId: string }>,
    searchParams: Promise<{ tab?: string }> 
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "teacher") {
        redirect("/signin");
    }

    const { courseId } = await params;
    const { tab } = await searchParams;
    const activeTab = tab || "activities";

    const course = await courseService.getCourseById(courseId);

    if (!course) {
        return <div className="p-8 text-center font-bold">Curso no encontrado</div>;
    }

    // Verify ownership
    if (course.teacher.id !== session.user.id) {
        return <div className="p-8 text-center font-bold text-destructive">No tienes permiso para ver este curso</div>;
    }

    const [activities, students, sharedContents, evaluationAssignments, teacherEvaluations, gradesData, attendanceReport, themes] = await Promise.all([
        activityService.getCourseActivities(courseId),
        courseService.getCourseStudents(courseId),
        sharedContentService.getByCourse(courseId),
        evaluationService.getCourseEvaluationAttempts(courseId),
        evaluationService.getTeacherEvaluations(session.user.id),
        gradeService.getCourseGradesData(courseId),
        getCourseAttendanceReportAction(courseId),
        getAvailableThemes()
    ]);
    
    const attendanceDateColumns = attendanceReport.length > 0 
        ? Object.keys(attendanceReport[0]).filter(key => key !== 'ID' && key !== 'Estudiante' && key !== 'Correo').sort()
        : [];

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Tabs key={activeTab} defaultValue={activeTab} className="w-full h-full flex flex-col">
                {/* Dedicated Client Header Component */}
                <TeacherCourseHeader 
                    courseId={courseId} 
                    courseTitle={course.title} 
                    courseExternalUrl={course.externalUrl}
                    userName={session.user.name || "Instructor"}
                    themes={themes}
                    activeTab={activeTab}
                />

                {/* Main Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    <TabsContent value="activities" className="mt-0 outline-none">
                        <ActivityManager courseId={courseId} activities={activities} />
                    </TabsContent>
                    <TabsContent value="students" className="mt-0 outline-none">
                        <StudentManager 
                            courseId={courseId} 
                            initialStudents={students} 
                            courseTitle={course.title}
                        />
                    </TabsContent>
                    <TabsContent value="roulette" className="mt-0 outline-none">
                        <Roulette students={students} courseId={courseId} />
                    </TabsContent>
                    <TabsContent value="groups" className="mt-0 outline-none">
                        <GroupGenerator students={students} />
                    </TabsContent>
                    <TabsContent value="evaluations" className="mt-0 outline-none">
                        <EvaluationAssignmentManager 
                            courseId={courseId}
                            attempts={evaluationAssignments}
                            teacherEvaluations={teacherEvaluations}
                        />
                    </TabsContent>
                    <TabsContent value="grades" className="mt-0 outline-none">
                        <GradesManager courseId={courseId} initialData={gradesData} courseTitle={course.title} />
                    </TabsContent>
                    <TabsContent value="stats" className="mt-0 outline-none">
                        <CourseStatistics 
                            courseId={courseId}
                            courseTitle={course.title}
                            attendanceData={attendanceReport}
                            attendanceDateColumns={attendanceDateColumns}
                            gradesData={gradesData}
                        />
                    </TabsContent>
                    <TabsContent value="share" className="mt-0 outline-none">
                        <GroupContentShare courseId={courseId} initialContent={sharedContents} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
