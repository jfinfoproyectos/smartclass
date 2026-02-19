"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Plus, Trash2, Volume2, VolumeX, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ScheduleItem {
    id: string;
    title: string;
    durationMinutes: number;
    timeLeft: number; // in seconds
    isCompleted: boolean;
}

export function VisualSchedule() {
    const [items, setItems] = useState<ScheduleItem[]>([]);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemDuration, setNewItemDuration] = useState("10");
    const [soundEnabled, setSoundEnabled] = useState(true);

    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        }
    }, []);

    const playAlert = () => {
        if (!audioContextRef.current || !soundEnabled) return;
        const ctx = audioContextRef.current;

        // Soft chime
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 1);
        });
    };

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeItemId) {
            interval = setInterval(() => {
                setItems(prevItems => prevItems.map(item => {
                    if (item.id === activeItemId) {
                        if (item.timeLeft <= 1) {
                            playAlert();
                            setActiveItemId(null); // Stop timer
                            return { ...item, timeLeft: 0, isCompleted: true };
                        }
                        return { ...item, timeLeft: item.timeLeft - 1 };
                    }
                    return item;
                }));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [activeItemId]);

    const handleAddItem = () => {
        if (!newItemTitle.trim()) return;
        const duration = parseInt(newItemDuration) || 5;

        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            title: newItemTitle,
            durationMinutes: duration,
            timeLeft: duration * 60,
            isCompleted: false
        };

        setItems([...items, newItem]);
        setNewItemTitle("");
        setNewItemDuration("10");
    };

    const toggleTimer = (id: string) => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (activeItemId === id) {
            setActiveItemId(null); // Pause
        } else {
            setActiveItemId(id); // Play (pauses others implicitly by state switch)
        }
    };

    const handleDelete = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        if (activeItemId === id) setActiveItemId(null);
    };

    const toggleComplete = (id: string) => {
        setItems(items.map(i => {
            if (i.id === id) {
                return { ...i, isCompleted: !i.isCompleted };
            }
            return i;
        }));
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Overall Progress Calculation
    const totalTime = items.reduce((acc, item) => acc + (item.durationMinutes * 60), 0);
    const totalTimeLeft = items.reduce((acc, item) => acc + item.timeLeft, 0);
    const progressPercentage = totalTime > 0 ? ((totalTime - totalTimeLeft) / totalTime) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Panel: Schedule List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col bg-muted/10 border-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                Agenda de Clase
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                title={soundEnabled ? "Silenciar alertas" : "Activar alertas"}
                            >
                                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progreso de la clase</span>
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto space-y-3 custom-scrollbar p-4 pt-0">
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                <p>No hay actividades planeadas</p>
                                <p className="text-sm">Agrega temas o actividades a la derecha.</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                                        item.id === activeItemId ? "bg-primary/5 border-primary shadow-md scale-[1.01]" : "bg-card hover:bg-muted/50",
                                        item.isCompleted && "opacity-60 bg-muted"
                                    )}
                                >
                                    <Checkbox
                                        checked={item.isCompleted}
                                        onCheckedChange={() => toggleComplete(item.id)}
                                        className="h-5 w-5"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={cn("font-medium truncate", item.isCompleted && "line-through text-muted-foreground")}>
                                                {item.title}
                                            </h3>
                                            <Badge variant={item.timeLeft === 0 ? "secondary" : "outline"} className="mono">
                                                {formatTime(item.timeLeft)}
                                            </Badge>
                                        </div>
                                        <Progress
                                            value={((item.durationMinutes * 60 - item.timeLeft) / (item.durationMinutes * 60)) * 100}
                                            className="h-1"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="icon"
                                            variant={activeItemId === item.id ? "default" : "outline"}
                                            className="h-9 w-9 rounded-full"
                                            onClick={() => toggleTimer(item.id)}
                                            disabled={item.isCompleted || item.timeLeft === 0}
                                        >
                                            {activeItemId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Add Item */}
            <div className="flex flex-col gap-4">
                <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg">Agregar Actividad</CardTitle>
                        <CardDescription>Planifica tu clase paso a paso</CardDescription>
                    </CardHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                placeholder="Ej. Introducción, Examen..."
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Duración (minutos)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={newItemDuration}
                                onChange={(e) => setNewItemDuration(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                        </div>
                        <Button className="w-full" onClick={handleAddItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar a la Agenda
                        </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                        <Label className="block mb-3 text-muted-foreground">Plantillas Rápidas</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setNewItemTitle("Bienvenida"); setNewItemDuration("5"); }}>
                                👋 Bienvenida
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setNewItemTitle("Teoría"); setNewItemDuration("15"); }}>
                                📚 Teoría
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setNewItemTitle("Actividad Grupal"); setNewItemDuration("20"); }}>
                                👥 Grupos
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setNewItemTitle("Cierre / Dudas"); setNewItemDuration("10"); }}>
                                🏁 Cierre
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
