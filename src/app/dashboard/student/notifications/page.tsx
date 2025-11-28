import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getStudentNotificationsAction } from "@/app/actions";
import { StudentNotifications } from "@/features/student/StudentNotifications";

export default async function Page() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "student") {
        redirect("/signin");
    }

    const notifications = await getStudentNotificationsAction();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Notificaciones</h2>
            </div>
            <StudentNotifications notifications={notifications} />
        </div>
    );
}
