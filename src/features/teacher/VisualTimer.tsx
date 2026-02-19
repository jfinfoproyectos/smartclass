"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Watch } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function VisualTimer() {
    // Mode: 'timer' (countdown) or 'stopwatch' (count up)
    const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

    // Timer state
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
    const [initialTime, setInitialTime] = useState(300);
    const [isRunning, setIsRunning] = useState(false);
    const [inputMinutes, setInputMinutes] = useState(5);
    const [inputSeconds, setInputSeconds] = useState(0);

    // Stopwatch state
    const [elapsedTime, setElapsedTime] = useState(0);

    // Audio state
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        }
    }, []);

    const playAlarm = () => {
        if (!audioContextRef.current || !soundEnabled) return;
        const ctx = audioContextRef.current;

        // Triple beep
        [0, 0.2, 0.4].forEach(start => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime + start);
            osc.frequency.setValueAtTime(440, ctx.currentTime + start + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + 0.15);
        });
    };

    const playTick = () => {
        if (!audioContextRef.current || !soundEnabled) return;
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    };

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning) {
            interval = setInterval(() => {
                if (mode === 'timer') {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            playAlarm();
                            setIsRunning(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setElapsedTime(prev => prev + 1);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, mode]);

    const toggleTimer = () => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        if (mode === 'timer') {
            setTimeLeft(initialTime);
        } else {
            setElapsedTime(0);
        }
    };

    const setTimerValues = (m: number, s: number) => {
        setIsRunning(false);
        const total = m * 60 + s;
        setTimeLeft(total);
        setInitialTime(total);
        setInputMinutes(m);
        setInputSeconds(s);
    };

    // Visualization helpers
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate progress (0 to 1)
    const progress = mode === 'timer'
        ? timeLeft / initialTime
        : 1; // Stopwatch always full or logic could be different

    // Color transition based on progress
    const getColor = (p: number) => {
        if (mode === 'stopwatch') return "bg-blue-500";
        if (p > 0.5) return "bg-green-500";
        if (p > 0.2) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getRingColor = (p: number) => {
        if (mode === 'stopwatch') return "stroke-blue-500";
        if (p > 0.5) return "stroke-green-500";
        if (p > 0.2) return "stroke-yellow-500";
        return "stroke-red-500";
    };

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Panel: Display */}
            <div className="lg:col-span-2 flex flex-col">
                <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20 relative overflow-hidden border-2">

                    {/* SVG Progress Ring */}
                    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle
                                cx="150"
                                cy="150"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="20"
                                fill="transparent"
                                className="text-muted"
                            />
                            {/* Progress */}
                            <motion.circle
                                cx="150"
                                cy="150"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="20"
                                fill="transparent"
                                strokeLinecap="round"
                                className={getRingColor(progress)}
                                initial={{ strokeDashoffset: 0 }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 0.5, ease: "linear" }}
                                style={{ strokeDasharray: circumference }}
                            />
                        </svg>

                        {/* Digital Time Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-7xl font-mono font-bold tabular-nums tracking-tighter",
                                mode === 'timer' && timeLeft < 10 && "text-red-500 animate-pulse"
                            )}>
                                {formatTime(mode === 'timer' ? timeLeft : elapsedTime)}
                            </span>
                            <span className="text-muted-foreground uppercase text-sm font-semibold tracking-widest mt-2">
                                {mode === 'timer' ? 'Restante' : 'Transcurrido'}
                            </span>
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="mt-12 flex items-center gap-6">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-16 w-16 rounded-full border-4"
                            onClick={toggleTimer}
                        >
                            {isRunning ? (
                                <Pause className="h-8 w-8 fill-current" />
                            ) : (
                                <Play className="h-8 w-8 fill-current ml-1" />
                            )}
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={resetTimer}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="absolute top-4 right-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                            {soundEnabled ? <Volume2 /> : <VolumeX />}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right Panel: Settings */}
            <div className="flex flex-col gap-4">
                <Card className="flex-1 p-6">
                    <Tabs value={mode} onValueChange={(v) => {
                        setMode(v as 'timer' | 'stopwatch');
                        setIsRunning(false);
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="timer" className="gap-2">
                                <Timer className="w-4 h-4" /> Temporizador
                            </TabsTrigger>
                            <TabsTrigger value="stopwatch" className="gap-2">
                                <Watch className="w-4 h-4" /> Cronómetro
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="timer" className="space-y-6">
                            <div className="space-y-4">
                                <Label>Definir Tiempo</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Minutos</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={inputMinutes}
                                            onChange={(e) => setInputMinutes(parseInt(e.target.value) || 0)}
                                            className="text-center text-lg h-12"
                                        />
                                    </div>
                                    <span className="text-xl font-bold mt-4">:</span>
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Segundos</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={inputSeconds}
                                            onChange={(e) => setInputSeconds(parseInt(e.target.value) || 0)}
                                            className="text-center text-lg h-12"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => setTimerValues(inputMinutes, inputSeconds)}>
                                    Establecer
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Predefinidos</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={() => setTimerValues(1, 0)}>1 Minuto</Button>
                                    <Button variant="outline" onClick={() => setTimerValues(5, 0)}>5 Minutos</Button>
                                    <Button variant="outline" onClick={() => setTimerValues(10, 0)}>10 Minutos</Button>
                                    <Button variant="outline" onClick={() => setTimerValues(15, 0)}>15 Minutos</Button>
                                    <Button variant="outline" onClick={() => setTimerValues(25, 0)}>Pomodoro (25m)</Button>
                                    <Button variant="outline" onClick={() => setTimerValues(0, 30)}>Sprint (30s)</Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="stopwatch">
                            <div className="text-center py-10 text-muted-foreground">
                                <div className="mb-4 flex justify-center">
                                    <Watch className="w-16 h-16 opacity-20" />
                                </div>
                                <p>Modo Cronómetro Activo</p>
                                <p className="text-sm">Cuenta el tiempo progresivamente sin límite.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
