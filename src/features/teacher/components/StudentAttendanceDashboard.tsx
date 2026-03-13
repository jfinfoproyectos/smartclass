"use client";

import { useMemo } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Calendar, 
    AlertTriangle, 
    Award, 
    Clock, 
    CheckCircle2, 
    XCircle,
    User
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface StudentAttendanceDashboardProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    studentData: any;
    dateColumns: string[];
}

export function StudentAttendanceDashboard({ 
    isOpen, 
    onOpenChange, 
    studentData, 
    dateColumns 
}: StudentAttendanceDashboardProps) {
    const { theme, resolvedTheme } = useTheme();
    const isDark = (resolvedTheme || theme) === 'dark';

    const stats = useMemo(() => {
        if (!studentData) return null;

        let p = 0, a = 0, l = 0, e = 0;
        let totalRemarks = 0;
        let attention = 0;
        let commendation = 0;

        const history: any[] = [];

        dateColumns.forEach(date => {
            const record = studentData[date];
            if (record && typeof record === 'object' && record.status !== '-') {
                if (record.status === 'P') p++;
                else if (record.status === 'A') a++;
                else if (record.status === 'L') l++;
                else if (record.status === 'E') e++;

                if (record.remarks) {
                    record.remarks.forEach((r: any) => {
                        totalRemarks++;
                        if (r.type === 'ATTENTION') attention++;
                        else if (r.type === 'COMMENDATION') commendation++;
                    });
                }

                history.push({
                    date,
                    ...record
                });
            }
        });

        const totalDays = p + a + l + e;
        const attendanceRate = totalDays > 0 ? ((p + l) / totalDays) * 100 : 0;

        return { 
            p, a, l, e, 
            totalRemarks, 
            attention, 
            commendation, 
            attendanceRate,
            history: history.sort((a, b) => b.date.localeCompare(a.date))
        };
    }, [studentData, dateColumns]);

    if (!studentData || !stats) return null;

    const chartColors = {
        text: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    };

    const pieData = {
        labels: ['Asistencias', 'Fallas', 'Tardes', 'Excusas'],
        datasets: [{
            data: [stats.p, stats.a, stats.l, stats.e],
            backgroundColor: [
                'rgba(34, 197, 94, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(59, 130, 246, 0.7)',
            ],
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
        }],
    };

    const barData = {
        labels: ['Atenciones', 'Felicitaciones'],
        datasets: [{
            label: 'Observaciones',
            data: [stats.attention, stats.commendation],
            backgroundColor: [
                'rgba(245, 158, 11, 0.7)',
                'rgba(168, 85, 247, 0.7)',
            ],
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: chartColors.text, font: { size: 10 } }
            }
        },
        scales: {
            x: { 
                grid: { display: false },
                ticks: { color: chartColors.text, font: { size: 10 } }
            },
            y: { 
                grid: { color: chartColors.grid },
                ticks: { color: chartColors.text, font: { size: 10 }, stepSize: 1 }
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{studentData.Estudiante}</DialogTitle>
                            <DialogDescription className="font-mono text-xs">
                                ID: {studentData.ID} | {studentData.Correo}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                    {/* Key Metrics */}
                    <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Asistencia</span>
                                <span className={cn(
                                    "text-2xl font-bold",
                                    stats.attendanceRate > 85 ? "text-green-600" : stats.attendanceRate > 75 ? "text-amber-600" : "text-red-600"
                                )}>
                                    {stats.attendanceRate.toFixed(1)}%
                                </span>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Inasistencias</span>
                                <span className="text-2xl font-bold text-red-600">{stats.a}</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Atenciones</span>
                                <span className="text-2xl font-bold text-amber-600">{stats.attention}</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Felicitaciones</span>
                                <span className="text-2xl font-bold text-purple-600">{stats.commendation}</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <Card className="md:col-span-1">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Distribución</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] p-2">
                            <Pie data={pieData} options={{ ...chartOptions, scales: undefined }} />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] p-2">
                            <Bar data={barData} options={chartOptions} />
                        </CardContent>
                    </Card>

                    {/* Recent History */}
                    <Card className="md:col-span-1">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-medium">Historial Reciente</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto max-h-[200px]">
                            <div className="divide-y">
                                {stats.history.slice(0, 10).map((record, i) => (
                                    <div key={i} className="px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">
                                                {format(new Date(record.date + 'T12:00:00Z'), "dd 'de' MMM", { locale: es })}
                                            </span>
                                            {record.status === 'L' && record.arrivalTime && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-2 w-2" /> 
                                                    {format(new Date(record.arrivalTime), "h:mm a")}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {record.remarks?.length > 0 && (
                                                <div className="flex -space-x-1">
                                                    {record.remarks.map((r: any, ri: number) => (
                                                        <div key={ri} className={cn(
                                                            "w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                                                            r.type === 'ATTENTION' ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                                                        )}>
                                                            {r.type === 'ATTENTION' ? <AlertTriangle className="h-2 w-2" /> : <Award className="h-2 w-2" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {record.status === 'P' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                             record.status === 'A' ? <XCircle className="h-4 w-4 text-red-500" /> :
                                             record.status === 'L' ? <Clock className="h-4 w-4 text-orange-500" /> :
                                             <Calendar className="h-4 w-4 text-blue-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
