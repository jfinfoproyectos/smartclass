"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function StudentNotifications({ notifications }: { notifications: any[] }) {
    const router = useRouter();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
        if (isRead) return; // Already read

        try {
            await markNotificationAsReadAction(notificationId);
            router.refresh();
        } catch (error) {
            toast.error("Error al marcar como leída");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsReadAction();
            toast.success("Todas las notificaciones marcadas como leídas");
            router.refresh();
        } catch (error) {
            toast.error("Error al marcar todas como leídas");
        }
    };

    return (
        <div className="space-y-4">
            {unreadCount > 0 && (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                    </p>
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Marcar todas como leídas
                    </Button>
                </div>
            )}

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            No tienes notificaciones en este momento
                        </p>
                    </CardContent>
                </Card>
            ) : (
                notifications.map((notification) => (
                    <Card
                        key={notification.id}
                        className={`transition-all cursor-pointer hover:shadow-md ${!notification.isRead
                                ? "border-l-4 border-l-primary bg-primary/5"
                                : ""
                            }`}
                        onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                                        {!notification.isRead && (
                                            <Badge variant="default" className="text-xs">Nueva</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{notification.teacher.name}</span>
                                        <span>•</span>
                                        <span>{new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                </div>
                                {notification.course && (
                                    <Badge variant="outline">{notification.course.title}</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
