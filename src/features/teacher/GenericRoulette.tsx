"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue, animate, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    RotateCcw, 
    Trophy, 
    Plus, 
    Trash2, 
    Volume2, 
    VolumeX, 
    ChevronDown, 
    X, 
    Sparkles,
    LayoutGrid,
    AlignLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface RouletteItem {
    id: string;
    label: string;
}

const SEGMENT_COLORS = [
    "#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA", "#FFDFBA", 
    "#E0BBE4", "#957DAD", "#D291BC", "#FEC8D8", "#FF9AA2",
];

export function GenericRoulette() {
    const [items, setItems] = useState<RouletteItem[]>([]);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [bulkInput, setBulkInput] = useState("");
    const [selected, setSelected] = useState<RouletteItem | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winnerModalOpen, setWinnerModalOpen] = useState(false);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [mounted, setMounted] = useState(false);

    const rotation = useMotionValue(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastTickRef = useRef(0);

    // Initialize
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("generic-roulette-items");
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to load generic roulette items", e);
            }
        }
    }, []);

    // Save
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("generic-roulette-items", JSON.stringify(items));
    }, [items, mounted]);

    // Audio Logic
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        }
    }, []);

    const playTickSound = () => {
        if (!audioContextRef.current || !soundEnabled) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

        gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.03);
    };

    const playWinSound = () => {
        if (!audioContextRef.current || !soundEnabled) return;
        const ctx = audioContextRef.current;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.4);
        });
    };

    useMotionValueEvent(rotation, "change", (latest) => {
        if (items.length === 0) return;
        const segmentAngle = 360 / items.length;
        const tickIndex = Math.floor(latest / segmentAngle);
        if (tickIndex !== lastTickRef.current) {
            playTickSound();
            lastTickRef.current = tickIndex;
        }
    });

    const handleAddItem = () => {
        if (!newItemLabel.trim()) return;
        const newItem: RouletteItem = {
            id: Date.now().toString(),
            label: newItemLabel.trim(),
        };
        setItems([...items, newItem]);
        setNewItemLabel("");
    };

    const handleBulkAdd = () => {
        if (!bulkInput.trim()) return;
        const newLabels = bulkInput
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== "");
        
        if (newLabels.length === 0) return;

        const newItems: RouletteItem[] = newLabels.map((label, index) => ({
            id: (Date.now() + index).toString(),
            label
        }));

        setItems([...items, ...newItems]);
        setBulkInput("");
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleClearItems = () => {
        setItems([]);
        localStorage.removeItem("generic-roulette-items");
        setConfirmClearOpen(false);
    };

    const handleSpin = async () => {
        if (items.length < 2 || isSpinning) return;

        setIsSpinning(true);
        setSelected(null);

        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const winnerIndex = Math.floor(Math.random() * items.length);
        const winner = items[winnerIndex];

        const segmentAngle = 360 / items.length;
        const offset = segmentAngle / 2;
        const spins = 5 + Math.floor(Math.random() * 5);

        const currentRot = rotation.get();
        const targetMod = 360 - (winnerIndex * segmentAngle) - offset;
        const currentMod = currentRot % 360;
        let delta = targetMod - currentMod;
        if (delta < 0) delta += 360;

        const finalRotation = currentRot + (360 * spins) + delta;

        await animate(rotation, finalRotation, {
            duration: 5,
            ease: [0.2, 0.8, 0.2, 1],
        });

        playWinSound();

        setTimeout(() => {
            setSelected(winner);
            setWinnerModalOpen(true);
            setIsSpinning(false);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });
        }, 500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Roulette Stage */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden border-2 shadow-lg bg-muted/10">
                    <div className="absolute top-4 left-4 z-10">
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-background/50 backdrop-blur">
                            Elementos: {items.length}
                        </Badge>
                    </div>

                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-full"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-full"
                            onClick={() => rotation.set(0)}
                            disabled={isSpinning}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 text-primary drop-shadow-md">
                            <ChevronDown className="w-12 h-12 fill-current" />
                        </div>

                        <motion.div
                            className="w-[90%] h-[90%] rounded-full shadow-2xl border-8 border-background relative overflow-hidden"
                            style={{ rotate: rotation }}
                        >
                            {items.length > 0 ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {items.map((item, i) => {
                                        const angle = 360 / items.length;
                                        const startAngle = i * angle;
                                        const endAngle = (i + 1) * angle;

                                        const startRad = (startAngle * Math.PI) / 180;
                                        const endRad = (endAngle * Math.PI) / 180;

                                        const x1 = 50 + 50 * Math.cos(startRad);
                                        const y1 = 50 + 50 * Math.sin(startRad);
                                        const x2 = 50 + 50 * Math.cos(endRad);
                                        const y2 = 50 + 50 * Math.sin(endRad);

                                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;

                                        return (
                                            <g key={item.id}>
                                                <path d={pathData} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} stroke="white" strokeWidth="0.5" />
                                                <text
                                                    x="50" y="50" fill="black"
                                                    fontSize={Math.max(2, 6 - (items.length * 0.1))}
                                                    fontWeight="bold" textAnchor="end" alignmentBaseline="middle"
                                                    transform={`rotate(${startAngle + angle / 2}, 50, 50) translate(46, 0)`}
                                                >
                                                    {item.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20 border-4 border-dashed rounded-full">
                                    <Sparkles className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Agrega elementos para empezar</p>
                                </div>
                            )}
                        </motion.div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <Button
                                onClick={handleSpin}
                                disabled={isSpinning || items.length < 2}
                                className={cn(
                                    "w-20 h-20 rounded-full shadow-2xl border-4 border-background bg-primary text-primary-foreground font-bold uppercase",
                                    isSpinning && "animate-pulse shadow-primary/20"
                                )}
                            >
                                {isSpinning ? "..." : "Girar"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Input Panel */}
            <div className="flex flex-col gap-4">
                <Card className="flex-1 flex flex-col p-6 overflow-hidden">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            Gestión de Elementos
                        </CardTitle>
                        <CardDescription>Añade los textos o nombres para sortear</CardDescription>
                    </CardHeader>
                    
                    <Tabs defaultValue="single" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="single" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Uno a uno
                            </TabsTrigger>
                            <TabsTrigger value="bulk" className="gap-2">
                                <AlignLeft className="h-4 w-4" />
                                Lista masiva
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="single" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="item-label">Nuevo Elemento</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="item-label"
                                        placeholder="Ej: Opción A, Nombre..." 
                                        value={newItemLabel}
                                        onChange={(e) => setNewItemLabel(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                    />
                                    <Button onClick={handleAddItem} size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="bulk" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bulk-input">Lista de Opciones (una por línea)</Label>
                                <Textarea 
                                    id="bulk-input"
                                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3..." 
                                    className="min-h-[120px] resize-none"
                                    value={bulkInput}
                                    onChange={(e) => setBulkInput(e.target.value)}
                                />
                                <Button 
                                    onClick={handleBulkAdd} 
                                    className="w-full gap-2"
                                    variant="secondary"
                                    disabled={!bulkInput.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                    Cargar Lista
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p className="text-sm italic">Lista vacía</p>
                            </div>
                        ) : (
                            items.map((item, i) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border group animate-in slide-in-from-right-4 duration-200">
                                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background border text-[10px] font-bold text-muted-foreground">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 font-medium truncate">{item.label}</div>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Limpiar Todo
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción eliminará permanentemente todos los elementos de la lista. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleClearItems}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Confirmar y Borrar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </Card>
            </div>

            {/* Winner Dialog */}
            <Dialog open={winnerModalOpen} onOpenChange={setWinnerModalOpen}>
                <DialogContent className="sm:max-w-md text-center bg-transparent border-none shadow-none">
                    <div className="bg-background rounded-3xl border-8 border-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] p-10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                        <Sparkles className="absolute top-4 right-4 text-primary opacity-20 h-12 w-12" />
                        <Sparkles className="absolute bottom-4 left-4 text-primary opacity-20 h-10 w-10" />

                        <DialogHeader>
                            <DialogTitle className="text-4xl font-black text-primary mb-4 tracking-tighter">¡EL ELEGIDO ES!</DialogTitle>
                        </DialogHeader>

                        {selected && (
                            <div className="py-8 relative z-10 flex flex-col items-center gap-6">
                                <div className="p-8 bg-primary/10 rounded-2xl border-4 border-dashed border-primary/20 w-full max-w-xs">
                                     <h2 className="text-4xl sm:text-5xl font-bold break-words">{selected.label}</h2>
                                </div>
                                <Trophy className="h-20 w-20 text-yellow-500 drop-shadow-lg animate-bounce" />
                            </div>
                        )}

                        <DialogFooter className="justify-center sm:justify-center pt-4">
                            <Button
                                size="lg"
                                onClick={() => setWinnerModalOpen(false)}
                                className="px-12 text-xl font-bold h-14 rounded-full shadow-lg"
                            >
                                Continuar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
