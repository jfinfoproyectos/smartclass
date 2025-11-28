import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getTeacherNotificationsAction } from "@/app/actions";
import { courseService } from "@/services/courseService";
import { NotificationManager } from "@/features/teacher/NotificationManager";

export default async function Page() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "teacher") {
        redirect("/signin");
    }

    const notifications = await getTeacherNotificationsAction();
    const courses = await courseService.getTeacherCourses(session.user.id);
    const students = await courseService.getStudentsForTeacher(session.user.id);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Notificaciones</h2>
            </div>
            <NotificationManager
                initialNotifications={notifications}
                courses={courses}
                students={students}
            />
        </div>
    );
}
