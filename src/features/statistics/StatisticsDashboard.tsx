"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatisticsData } from "./actions";
import { StatisticsCharts } from "./StatisticsCharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export function StatisticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        courses: { id: string; title: string }[];
        selectedCourseId: string;
        studentMetrics: {
            id: string;
            name: string;
            email: string;
            averageGrade: number;
            attendancePercentage: number;
            missingActivities: number;
            remarksCount: number;
        }[];
        charts: {
            activityPerformance: any[];
            distribution: any[];
            attendanceTrends: any[];
        };
    } | null>(null);

    const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Reporte_Estadisticas_${data?.courses.find(c => c.id === (selectedCourse || data.selectedCourseId))?.title.replace(/\s+/g, '_') || 'Curso'}`,
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getStatisticsData(selectedCourse);
                setData(result);
                // If no course was selected (initial load), set it from result
                if (!selectedCourse && result?.selectedCourseId) {
                    setSelectedCourse(result.selectedCourseId);
                }
            } catch (error) {
                console.error("Failed to fetch statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCourse]);

    if (loading && !data) {
        return <LoadingSpinner message="Cargando estadísticas..." />;
    }

    if (!data) {
        return <div className="p-8 text-center text-destructive">No se encontraron datos o cursos disponibles.</div>;
    }

    // Calculate course averages for summary cards
    const courseAverage = data.studentMetrics.length > 0
        ? (data.studentMetrics.reduce((acc, curr) => acc + curr.averageGrade, 0) / data.studentMetrics.length).toFixed(2)
        : "N/A";

    const averageAttendance = data.studentMetrics.length > 0
        ? (data.studentMetrics.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / data.studentMetrics.length).toFixed(1) + "%"
        : "N/A";

    const totalMissingActivities = data.studentMetrics.reduce((acc, curr) => acc + curr.missingActivities, 0);

    const currentCourseName = data.courses.find(c => c.id === (selectedCourse || data.selectedCourseId))?.title;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Estadísticas del Curso</h2>

                <div className="flex gap-4 w-full md:w-auto items-center">
                    {/* Course Filter */}
                    <Select value={selectedCourse || data.selectedCourseId} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Seleccionar curso" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                            {data.courses.map(course => (
                                <SelectItem key={course.id} value={course.id} className="truncate">
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={() => handlePrint()} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Generar PDF</span>
                    </Button>
                </div>
            </div>

            {/* Printable Content */}
            <div ref={componentRef} className="space-y-6 print:p-8 print:bg-white print:text-black">
                {/* Print Header */}
                <div className="hidden print:block mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold">Reporte de Estadísticas</h1>
                    <p className="text-xl text-muted-foreground">{currentCourseName}</p>
                    <p className="text-sm text-muted-foreground mt-2">Generado el: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
                    <Card className="print:border print:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Promedio del Curso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courseAverage}</div>
                            <p className="text-xs text-muted-foreground">Calificación promedio general</p>
                        </CardContent>
                    </Card>
                    <Card className="print:border print:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{averageAttendance}</div>
                            <p className="text-xs text-muted-foreground">Porcentaje de asistencia del grupo</p>
                        </CardContent>
                    </Card>
                    <Card className="print:border print:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Actividades Faltantes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMissingActivities}</div>
                            <p className="text-xs text-muted-foreground">Total acumulado de entregas pendientes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="print:break-inside-avoid">
                    <StatisticsCharts data={data.charts} />
                </div>

                {/* Student Performance Table */}
                <Card className="print:border print:shadow-none print:break-before-page">
                    <CardHeader>
                        <CardTitle>Detalle por Estudiante</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead className="text-center">Promedio</TableHead>
                                    <TableHead className="text-center">Asistencia</TableHead>
                                    <TableHead className="text-center">Act. Faltantes</TableHead>
                                    <TableHead className="text-center">Observaciones</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.studentMetrics.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium max-w-[200px]">
                                            <div className="truncate">{student.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            <span className={student.averageGrade < 3.0 ? "text-destructive print:text-red-600" : "text-primary print:text-black"}>
                                                {student.averageGrade.toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={student.attendancePercentage < 75 ? "text-destructive print:text-red-600" : ""}>
                                                {student.attendancePercentage}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.missingActivities > 0 ? (
                                                <Badge variant="destructive" className="print:border-red-600 print:text-red-600 print:bg-transparent">{student.missingActivities}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-600">Al día</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{student.remarksCount}</TableCell>
                                        <TableCell className="text-center">
                                            {student.averageGrade >= 3.0 ? (
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 print:bg-transparent print:text-green-600 print:border-green-600 print:border">Aprobando</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="print:bg-transparent print:text-red-600 print:border-red-600 print:border">En Riesgo</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
