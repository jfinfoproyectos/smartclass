"use client";

import { useState } from "react";
import { Timer, Wrench, ArrowLeft, ChevronRight } from "lucide-react";
import { VisualTimer } from "@/features/teacher/VisualTimer";
import { GenericRoulette } from "@/features/teacher/GenericRoulette";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TeacherToolsPage() {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const tools = [
        {
            id: 'timer',
            title: 'Temporizador',
            description: 'Gestiona el tiempo de tus actividades con una cuenta regresiva visual y alertas sonoras.',
            icon: Timer,
            color: 'text-blue-500',
            bg: 'bg-blue-50/50 dark:bg-blue-950/20',
            border: 'border-blue-100 dark:border-blue-900/30',
            component: <VisualTimer />
        },
        {
            id: 'generic-roulette',
            title: 'Ruleta Genérica',
            description: 'Sortea cualquier cosa: temas, premios o actividades ingresando tus propios elementos.',
            icon: Sparkles,
            color: 'text-orange-500',
            bg: 'bg-orange-50/50 dark:bg-orange-950/20',
            border: 'border-orange-100 dark:border-orange-900/30',
            component: <GenericRoulette />
        }
    ];

    const selectedTool = tools.find(t => t.id === activeTool);

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            {!activeTool ? (
                <>
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Wrench className="h-8 w-8 text-primary" />
                            </div>
                            Herramientas del Instructor
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Utilidades rápidas para potenciar tus clases y mejorar la gestión del tiempo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {tools.map((tool) => (
                            <Card 
                                key={tool.id} 
                                className={cn(
                                    "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2",
                                    tool.border
                                )}
                                onClick={() => setActiveTool(tool.id)}
                            >
                                <CardHeader className="space-y-4">
                                    <div className={cn("p-3 w-fit rounded-xl transition-colors duration-300 group-hover:scale-110", tool.bg)}>
                                        <tool.icon className={cn("h-8 w-8", tool.color)} />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                            {tool.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-relaxed min-h-[40px]">
                                            {tool.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                                        Abrir herramienta <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setActiveTool(null)}
                                className="h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    {selectedTool && <selectedTool.icon className={cn("h-6 w-6", selectedTool.color)} />}
                                    {selectedTool?.title}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedTool?.description}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-card rounded-xl shadow-inner min-h-[600px]">
                        {selectedTool?.component}
                    </div>
                </div>
            )}
        </div>
    );
}
