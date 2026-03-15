"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
    getCourseAttendanceReportAction 
} from "@/app/actions";
import { toast } from "sonner";
import { 
    Loader2, 
    Users,
    Search,
    Award,
    AlertTriangle,
    Info,
    Calendar as CalendarIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceStatistics } from "./AttendanceStatistics";
import { StudentAttendanceDashboard } from "./StudentAttendanceDashboard";
import { BarChart3, Download, TrendingDown } from "lucide-react";
import * as XLSX from 'xlsx';

interface GroupAttendanceSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
    courseTitle: string;
}

export function GroupAttendanceSheet({
    isOpen,
    onOpenChange,
    courseId,
    courseTitle
}: GroupAttendanceSheetProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getCourseAttendanceReportAction(courseId);
            setData(result || []);
        } catch (error) {
            console.error("Error loading group attendance report:", error);
            toast.error("Error al cargar el resumen de asistencia");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, courseId]);

    const dateColumns = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter(key => 
            key !== 'ID' && key !== 'Estudiante' && key !== 'Correo'
        ).sort();
    }, [data]);

    const filteredData = useMemo(() => {
        let result = data;
        
        // Apply search
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(row => 
                row.Estudiante?.toLowerCase().includes(lowSearch) || 
                row.ID?.toLowerCase().includes(lowSearch)
            );
        }

        // Apply Drill-down chart filter
        if (activeFilter) {
            result = result.filter(row => {
                return dateColumns.some(date => row[date]?.status === activeFilter);
            });
        }

        return result;
    }, [data, searchTerm, activeFilter, dateColumns]);

    const handleExportExcel = () => {
        try {
            const exportData = data.map(row => {
                const base: any = {
                    'ID': row.ID,
                    'Estudiante': row.Estudiante,
                    'Correo': row.Correo,
                };
                
                dateColumns.forEach(date => {
                    const cell = row[date];
                    base[date] = cell === '-' ? '-' : (cell.status || '-');
                });
                
                return base;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
            XLSX.writeFile(wb, `Asistencia_${courseTitle}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            toast.success("Excel generado correctamente");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al exportar a Excel");
        }
    };

    const getDesertionRisk = (row: any) => {
        if (dateColumns.length === 0) return 0;
        let absences = 0;
        let total = 0;
        dateColumns.forEach(date => {
            if (row[date]?.status !== '-') {
                total++;
                if (row[date]?.status === 'A') absences++;
            }
        });
        return total > 0 ? (absences / total) * 100 : 0;
    };

    const renderCellContent = (cellData: any) => {
        if (cellData === '-') return <span className="text-muted-foreground">-</span>;
        
        const { status, justification, arrivalTime, remarks } = cellData;

        const markers = [];

        // Attendance Marker
        if (status && status !== '-') {
            let badge = null;
            let tooltipContent = null;

            switch (status) {
                case 'P':
                    badge = <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 w-6 h-6 p-0 flex items-center justify-center font-bold text-[10px]">P</Badge>;
                    tooltipContent = "Presente";
                    break;
                case 'A':
                    badge = <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 w-6 h-6 p-0 flex items-center justify-center font-bold text-[10px]">A</Badge>;
                    tooltipContent = "Inasistencia";
                    break;
                case 'L':
                    badge = <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 w-6 h-6 p-0 flex items-center justify-center font-bold text-[10px]">T</Badge>;
                    tooltipContent = (
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">Llegada Tarde</span>
                            {arrivalTime && (
                                <span className="text-xs">
                                    Hora: {format(new Date(arrivalTime), "h:mm a", { locale: es })}
                                </span>
                            )}
                        </div>
                    );
                    break;
                case 'E':
                    badge = <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 w-6 h-6 p-0 flex items-center justify-center font-bold text-[10px]">E</Badge>;
                    tooltipContent = (
                        <div className="flex flex-col gap-1 max-w-[200px]">
                            <span className="font-bold">Excusado</span>
                            {justification && (
                                <span className="text-xs italic whitespace-normal">
                                    "{justification}"
                                </span>
                            )}
                        </div>
                    );
                    break;
            }

            if (badge) {
                markers.push(
                    <Tooltip key="attendance">
                        <TooltipTrigger asChild>
                            <div className="cursor-help">{badge}</div>
                        </TooltipTrigger>
                        <TooltipContent>{tooltipContent}</TooltipContent>
                    </Tooltip>
                );
            }
        }

        // Remarks Markers
        if (remarks && Array.isArray(remarks)) {
            remarks.forEach((remark, idx) => {
                const isAttention = remark.type === 'ATTENTION';
                const Icon = isAttention ? AlertTriangle : Award;
                const bgColor = isAttention ? 'bg-amber-100' : 'bg-purple-100';
                const textColor = isAttention ? 'text-amber-700' : 'text-purple-700';
                const borderColor = isAttention ? 'border-amber-200' : 'border-purple-200';

                markers.push(
                    <Tooltip key={`remark-${idx}`}>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "cursor-help w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                bgColor, textColor, borderColor
                            )}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex flex-col gap-1 max-w-[200px]">
                                <span className="font-bold">{isAttention ? "Llamado de Atención" : "Felicitación"}</span>
                                <span className="text-xs font-semibold">{remark.title}</span>
                                {remark.description && (
                                    <span className="text-[10px] italic whitespace-normal text-muted-foreground">
                                        {remark.description}
                                    </span>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
            });
        }

        return (
            <div className="flex items-center justify-center gap-1 min-h-[24px]">
                {markers.length > 0 ? markers : <span className="text-muted-foreground text-[10px]">-</span>}
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[100dvh] sm:h-[100dvh] p-0 flex flex-col gap-0 max-w-full">
                <Tabs defaultValue="matrix" className="flex-1 flex flex-col overflow-hidden">
                    <SheetHeader className="p-6 border-b shrink-0">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <SheetTitle className="text-2xl flex items-center gap-2">
                                    <Users className="h-6 w-6 text-primary" />
                                    Resumen de Asistencia y Observaciones - {courseTitle}
                                </SheetTitle>
                                <SheetDescription>
                                    Vista general de asistencia, llamados de atención y felicitaciones.
                                </SheetDescription>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <TabsList className="bg-muted/50 h-10 p-1">
                                    <TabsTrigger 
                                        value="matrix" 
                                        className="px-4 h-8"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Matriz
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="stats"
                                        className="px-4 h-8"
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Estadísticas
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-10 gap-2 text-xs" 
                                        onClick={handleExportExcel}
                                        disabled={loading || data.length === 0}
                                    >
                                        <Download className="h-4 w-4" />
                                        Excel
                                    </Button>

                                    {(searchTerm || activeFilter) && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-10 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setActiveFilter(null);
                                            }}
                                        >
                                            Limpiar Filtros
                                        </Button>
                                    )}

                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar estudiante..."
                                            className="pl-9 h-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={loadData} disabled={loading} title="Recargar">
                                        <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-hidden">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground animate-pulse">Cargando reporte consolidado...</p>
                                </div>
                            ) : (
                                <TooltipProvider>
                                    <TabsContent value="matrix" className="h-full mt-0 flex flex-col overflow-hidden">
                                        <div className="flex-1 overflow-auto relative">
                                            <Table className="border-separate border-spacing-0">
                                                <TableHeader className="sticky top-0 bg-secondary z-30 shadow-sm">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[220px] min-w-[220px] sticky left-0 top-0 bg-secondary z-40 border-r border-b">
                                                            Estudiante
                                                        </TableHead>
                                                        {dateColumns.map(date => (
                                                            <TableHead key={date} className="min-w-[100px] text-center px-2 bg-secondary border-b">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                                        {new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'short' })}
                                                                    </span>
                                                                    <span className="text-sm font-medium">
                                                                        {new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </TableHead>
                                                        ))}
                                                        {dateColumns.length === 0 && (
                                                            <TableHead className="text-center italic text-muted-foreground bg-secondary border-b">No hay registros</TableHead>
                                                        )}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredData.length > 0 ? (
                                                        filteredData.map((row, idx) => {
                                                            const risk = getDesertionRisk(row);
                                                            const isAtRisk = risk > 15;
                                                            
                                                            return (
                                                                <TableRow key={row.ID || idx} className={cn("hover:bg-muted/50 h-12", isAtRisk && "bg-red-50/50 dark:bg-red-950/20")}>
                                                                    <TableCell 
                                                                        className={cn(
                                                                            "font-medium sticky left-0 bg-background z-20 border-r border-b whitespace-nowrap overflow-hidden text-ellipsis shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.1)] cursor-pointer group hover:text-primary transition-colors",
                                                                            isAtRisk && "bg-red-50 dark:bg-red-950/30"
                                                                        )}
                                                                        onClick={() => setSelectedStudent(row)}
                                                                    >
                                                                        <div className="flex flex-col leading-tight relative">
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{row.Estudiante}</span>
                                                                                {isAtRisk && (
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <TrendingDown className="h-3 w-3 text-red-500" />
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>Riesgo de deserción: {risk.toFixed(1)}% inasistencias</TooltipContent>
                                                                                    </Tooltip>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">{row.ID}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    {dateColumns.map(date => (
                                                                        <TableCell key={date} className="text-center p-2 border-b">
                                                                            {renderCellContent(row[date])}
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            );
                                                        })
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={dateColumns.length + 1} className="h-24 text-center">
                                                                No se encontraron estudiantes.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="stats" className="h-full mt-0 p-6 overflow-y-auto">
                                        <AttendanceStatistics 
                                            data={data} 
                                            dateColumns={dateColumns} 
                                            onFilter={(val) => {
                                                if (['P', 'A', 'L', 'E'].includes(val)) {
                                                    setActiveFilter(val);
                                                    setSearchTerm("");
                                                    toast.info(`Filtrando por estado: ${val === 'P' ? 'Presente' : val === 'A' ? 'Inasistencia' : val === 'L' ? 'Tarde' : 'Excusado'}`);
                                                } else {
                                                    setSearchTerm(val);
                                                    setActiveFilter(null);
                                                    toast.info(`Filtrando por estudiante: ${val}`);
                                                }
                                            }}
                                        />
                                    </TabsContent>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </Tabs>

                <StudentAttendanceDashboard 
                    isOpen={!!selectedStudent}
                    onOpenChange={(open) => !open && setSelectedStudent(null)}
                    studentData={selectedStudent}
                    dateColumns={dateColumns}
                />

                <div className="p-4 border-t bg-muted/30 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold">P</Badge>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Presente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold">A</Badge>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Inasistencia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold">T</Badge>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Tarde</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold">E</Badge>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Excusado</span>
                            </div>
                            <div className="w-[1px] h-4 bg-muted-foreground/20 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <div className="bg-amber-100 text-amber-700 border border-amber-200 rounded-md w-5 h-5 flex items-center justify-center">
                                    <AlertTriangle className="h-3 w-3" />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Llamado Atención</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-100 text-purple-700 border border-purple-200 rounded-md w-5 h-5 flex items-center justify-center">
                                    <Award className="h-3 w-3" />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Felicitación</span>
                            </div>
                        </div>
                        
                        <div className="text-[10px] font-medium text-muted-foreground uppercase bg-background/50 px-2 py-1 rounded border">
                            {filteredData.length} Ests / {dateColumns.length} Fechas
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
