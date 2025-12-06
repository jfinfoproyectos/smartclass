"use client";

import { Bell, Calendar, Info, AlertTriangle, Wrench, Trophy, AlertCircle, Newspaper, PartyPopper, BookOpen, Settings2, CalendarClock, BarChart, Users, Activity, ScrollText, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnnouncementsAction, getSettingsAction } from "@/app/actions";
import MDEditor from "@uiw/react-md-editor";
import { authClient } from "@/lib/auth-client";
import { getRoleFromUser } from "@/services/authService";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
    const [settings, setSettings] = useState<{ institutionName?: string | null; institutionLogo?: string | null; institutionHeroImage?: string | null }>({});
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const { data: session } = authClient.useSession();
    const role = getRoleFromUser(session?.user);

    useEffect(() => {
        const fetchData = async () => {
            const [settingsData, announcementsData] = await Promise.all([
                getSettingsAction(),
                getAnnouncementsAction(),
            ]);
            setSettings(settingsData || {});
            setAnnouncements(announcementsData || []);
        };
        fetchData();
    }, []);

    const getNavigationItems = () => {
        if (role === "admin") {
            return [
                { title: "Usuarios", url: "/dashboard/admin/users", icon: Users, color: "text-blue-500" },
                { title: "Cursos", url: "/dashboard/admin/courses", icon: BookOpen, color: "text-green-500" },
                { title: "Anuncios", url: "/dashboard/admin/announcements", icon: Bell, color: "text-yellow-500" },
                { title: "Sistema", url: "/dashboard/admin/system", icon: Activity, color: "text-purple-500" },
                { title: "Auditoría", url: "/dashboard/admin/audit", icon: ScrollText, color: "text-orange-500" },
                { title: "Configuración", url: "/dashboard/admin/settings", icon: Settings2, color: "text-gray-500" },
            ];
        } else if (role === "teacher") {
            return [
                { title: "Mis Cursos", url: "/dashboard/teacher", icon: BookOpen, color: "text-blue-500" },
                { title: "Notificaciones", url: "/dashboard/teacher/notifications", icon: Bell, color: "text-yellow-500" },
                { title: "Calendario", url: "/dashboard/calendar", icon: Calendar, color: "text-green-500" },
                { title: "Horario", url: "/dashboard/teacher/schedule", icon: CalendarClock, color: "text-purple-500" },
                { title: "Estadísticas", url: "/dashboard/teacher/statistics", icon: BarChart, color: "text-orange-500" },
            ];
        } else {
            // Student
            return [
                { title: "Mis Cursos", url: "/dashboard/student", icon: BookOpen, color: "text-blue-500" },
                { title: "Notificaciones", url: "/dashboard/student/notifications", icon: Bell, color: "text-yellow-500" },
                { title: "Calendario", url: "/dashboard/calendar", icon: Calendar, color: "text-green-500" },
                { title: "Horario", url: "/dashboard/student/schedule", icon: CalendarClock, color: "text-purple-500" },
            ];
        }
    };

    const navItems = getNavigationItems();

    const renderAnnouncement = (announcement: any, index: number) => {
        const type = announcement.type || "INFO";
        const showImage = announcement.showImage ?? true;
        const imagePosition = announcement.imagePosition || "LEFT";
        const hasImage = showImage && announcement.imageUrl;
        const isImageRight = imagePosition === "RIGHT";

        // Helper component for image display
        const ImageSection = hasImage ? (
            <div className="w-full md:w-1/2 relative min-h-[400px]">
                <img
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
        ) : null;

        if (type === "URGENT") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-red-600 text-white border-b-4 border-red-800 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-12 flex flex-col items-center justify-center relative`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
                        <div className="relative z-10 max-w-4xl w-full">
                            <AlertTriangle className="w-16 h-16 mb-4 animate-pulse mx-auto" />
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 drop-shadow-md text-center">
                                {announcement.title}
                            </h3>
                            <div className="prose prose-invert prose-lg max-w-4xl w-full text-red-50 font-medium">
                                <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                            </div>
                            <div className="mt-6 text-sm font-bold bg-white/20 px-4 py-1 rounded-full text-center">
                                URGENTE • {new Date(announcement.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "EVENT") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white border-b border-indigo-800 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-16 flex items-center justify-center relative`}>
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20"></div>

                        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                            <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center min-w-[150px]">
                                <Calendar className="w-10 h-10 mx-auto mb-2 text-purple-300" />
                                <div className="text-4xl font-bold">{new Date(announcement.createdAt).getDate()}</div>
                                <div className="text-xl uppercase tracking-wider text-purple-200">
                                    {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short' })}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200 text-center md:text-left">
                                    {announcement.title}
                                </h3>
                                <div className="prose prose-invert prose-lg max-w-none text-purple-100">
                                    <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "MAINTENANCE") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-yellow-400 text-yellow-900 border-b-8 border-yellow-500 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-12 flex items-center justify-center relative`}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}></div>
                        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
                            <Wrench className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-800 shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold mb-4 uppercase border-b-4 border-yellow-800 inline-block pb-2">
                                    {announcement.title}
                                </h3>
                                <div className="prose prose-yellow prose-lg max-w-none font-mono text-yellow-900">
                                    <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit', fontFamily: 'monospace' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "SUCCESS") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white border-b border-green-700 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-16 flex items-center justify-center relative`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
                            <Trophy className="w-20 h-20 mb-6 text-yellow-300 animate-bounce" />
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
                                {announcement.title}
                            </h3>
                            <div className="prose prose-invert prose-lg max-w-4xl w-full text-green-50">
                                <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                            </div>
                            <div className="mt-6 text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">
                                ✨ {new Date(announcement.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "WARNING") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-gradient-to-r from-orange-500 to-amber-600 text-white border-l-8 border-orange-700 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-12 flex items-center justify-center relative`}>
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-start gap-6">
                            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 text-orange-100" />
                            <div className="flex-1">
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
                                    {announcement.title}
                                </h3>
                                <div className="prose prose-invert prose-lg max-w-none text-orange-50">
                                    <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                                </div>
                                <div className="mt-4 text-sm font-medium bg-white/20 px-3 py-1 rounded inline-block">
                                    ⚠️ {new Date(announcement.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "NEWSLETTER") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700 relative`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-16`}>
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-900 dark:border-slate-100">
                                <Newspaper className="w-8 h-8" />
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold">
                                    {announcement.title}
                                </h3>
                            </div>
                            <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                                <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                            </div>
                            <div className="mt-6 text-sm text-slate-600 dark:text-slate-400 font-serif italic">
                                Publicado el {new Date(announcement.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "CELEBRATION") {
            return (
                <div key={announcement.id} className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white border-b border-pink-600 relative overflow-hidden`}>
                    {ImageSection}
                    <div className={`w-full ${hasImage ? 'md:w-1/2' : ''} p-8 md:p-16 flex items-center justify-center relative`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
                            <div className="absolute top-20 right-20 w-3 h-3 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute bottom-20 left-1/4 w-5 h-5 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                        </div>
                        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
                            <PartyPopper className="w-20 h-20 mb-6 text-yellow-200" />
                            <h3 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                                {announcement.title}
                            </h3>
                            <div className="prose prose-invert prose-lg max-w-4xl w-full text-pink-50">
                                <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                            </div>
                            <div className="mt-6 text-lg font-bold bg-white/20 px-6 py-2 rounded-full">
                                🎉 {new Date(announcement.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Default: INFO
        return (
            <div
                key={announcement.id}
                className={`w-full flex flex-col md:flex-row ${isImageRight ? 'md:flex-row-reverse' : ''} bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 last:border-0`}
            >
                {ImageSection}

                <div className={`w-full ${hasImage ? 'md:w-1/2' : 'max-w-5xl mx-auto'} p-8 md:p-16 flex flex-col justify-center`}>
                    <div className="flex items-center gap-2 text-primary mb-4 justify-start">
                        <Info className="w-5 h-5" />
                        <span className="text-sm font-medium">
                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
                        {announcement.title}
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-lg text-muted-foreground leading-relaxed">
                        <MDEditor.Markdown source={announcement.content} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                    </div>
                </div>
            </div>
        );
    };

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
                                ¡Hola, {session?.user?.name?.split(' ')[0] || 'Usuario'}!
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

                <div className="w-full py-16 space-y-0">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-12 dark:text-white text-slate-900 flex flex-wrap items-center gap-3 justify-center px-4">
                        <Bell className="w-10 h-10" /> Anuncios Recientes
                    </h2>

                    {announcements.length > 0 ? (
                        <div className="flex flex-col w-full">
                            {announcements.map((announcement, index) => renderAnnouncement(announcement, index))}
                        </div>
                    ) : (
                        <div className="text-center p-20 border-y border-dashed dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                            <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-xl text-muted-foreground">No hay anuncios recientes para mostrar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
