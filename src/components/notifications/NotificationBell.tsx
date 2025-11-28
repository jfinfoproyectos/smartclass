"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { getStudentNotificationsAction } from "@/app/actions";

export function NotificationBell() {
    const router = useRouter();
    const { data: session } = useSession();
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (session?.user?.role === "student") {
                try {
                    const notifications = await getStudentNotificationsAction();
                    setNotificationCount(notifications.length);
                } catch (error) {
                    console.error("Failed to fetch notifications", error);
                }
            }
        };

        fetchNotifications();

        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [session]);

    if (session?.user?.role !== "student") {
        return null;
    }

    const handleClick = () => {
        router.push("/dashboard/student/notifications");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleClick}
            title="Notificaciones"
        >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                    {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
            )}
        </Button>
    );
}
