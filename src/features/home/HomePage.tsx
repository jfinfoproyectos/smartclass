"use client";

import { Bell, Calendar, Info, AlertTriangle, Wrench, Trophy, AlertCircle, Newspaper, PartyPopper, BookOpen, Settings2, CalendarClock, BarChart, Users, Activity, ScrollText, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { getSettingsAction } from "@/app/actions";
import MDEditor from "@uiw/react-md-editor";
import { authClient } from "@/lib/auth-client";
import { getRoleFromUser } from "@/services/authService";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
    const [settings, setSettings] = useState<{ institutionName?: string | null; institutionLogo?: string | null; institutionHeroImage?: string | null }>({});
    const [mounted, setMounted] = useState(false);
    const { data: session } = authClient.useSession();
    const role = getRoleFromUser(session?.user);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const [settingsData] = await Promise.all([
                getSettingsAction(),
            ]);
            setSettings(settingsData || {});
        };
        fetchData();
    }, []);

    const getNavigationItems = () => {
        // Only return items if mounted to prevent hydration mismatch
        if (!mounted) {
            return [];
        }

        if (role === "admin") {
            return [
                { title: "Usuarios", url: "/dashboard/admin/users", icon: Users, color: "text-blue-500" },
                { title: "Cursos", url: "/dashboard/admin/courses", icon: BookOpen, color: "text-green-500" },
                { title: "Sistema", url: "/dashboard/admin/system", icon: Activity, color: "text-purple-500" },
                { title: "Auditoría", url: "/dashboard/admin/audit", icon: ScrollText, color: "text-orange-500" },
                { title: "Configuración", url: "/dashboard/admin/settings", icon: Settings2, color: "text-gray-500" },
            ];
        } else if (role === "teacher") {
            return [
                { title: "Mis Cursos", url: "/dashboard/teacher", icon: BookOpen, color: "text-blue-500" },
                { title: "Calendario", url: "/dashboard/calendar", icon: Calendar, color: "text-green-500" },
                { title: "Horario", url: "/dashboard/teacher/schedule", icon: CalendarClock, color: "text-purple-500" },
                { title: "Estadísticas", url: "/dashboard/teacher/statistics", icon: BarChart, color: "text-orange-500" },
            ];
        } else {
            // Student
            return [
                { title: "Mis Cursos", url: "/dashboard/student", icon: BookOpen, color: "text-blue-500" },
                { title: "Calendario", url: "/dashboard/calendar", icon: Calendar, color: "text-green-500" },
                { title: "Horario", url: "/dashboard/student/schedule", icon: CalendarClock, color: "text-purple-500" },
            ];
        }
    };

    const navItems = getNavigationItems();


    return (
        <div className="min-h-[calc(100vh-4rem)] h-auto -ml-4 -mr-4 -mb-4 w-[calc(100%+2rem)] rounded-none overflow-hidden">
            <div className="relative flex flex-col w-full">
                <div className="w-full relative min-h-[300px] md:min-h-[400px] flex flex-col justify-center overflow-hidden">
                    {settings.institutionHeroImage ? (
                        <div className="absolute inset-0">
                            <img
                                src={settings.institutionHeroImage || undefined}
                                alt="Hero Background"
                                className="w-full h-full object-cover opacity-60"
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20"></div>

                    )}

                    <div className={`relative z-10 flex flex-col items-center justify-center py-10 px-4 text-center ${settings.institutionHeroImage ? 'text-white' : 'text-foreground'}`}>

                        {settings.institutionLogo && (
                            <img
                                src={settings.institutionLogo || undefined}
                                alt="Logo Institucional"
                                className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6 drop-shadow-2xl bg-white/10 backdrop-blur-sm rounded-full p-3"
                            />
                        )}
                        <h1 className={`text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight px-4 ${settings.institutionHeroImage ? 'drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]' : ''}`}>

                            {settings.institutionName}
                        </h1>

                        {/* Greeting and Date */}
                        <div className={`mt-6 space-y-2 ${settings.institutionHeroImage ? 'text-white/90' : 'text-muted-foreground'}`}>

                            <h2 className="text-xl md:text-2xl font-medium drop-shadow-md">
                                ¡Hola, {mounted ? (session?.user?.name?.split(' ')[0] || 'Usuario') : 'Usuario'}!
                            </h2>
                            <p className="text-sm md:text-base opacity-90 capitalize drop-shadow-md">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <div className="w-full py-12 px-6 bg-muted/30 border-y">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center">Acceso Rápido</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {navItems.map((item, index) => (
                                <Link key={index} href={item.url}>
                                    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full border-primary/10">
                                        <CardHeader className="flex flex-col items-center justify-center text-center space-y-4 p-6">
                                            <div className={`p-4 rounded-full bg-background shadow-sm ${item.color}`}>
                                                <item.icon className="w-8 h-8" />
                                            </div>
                                            <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
