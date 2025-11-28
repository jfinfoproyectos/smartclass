"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatisticsData } from "./actions";
import { StatisticsCharts } from "./StatisticsCharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function StatisticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        courses: { id: string; title: string }[];
        students: { id: string; name: string }[];
        charts: {
            grades: any[];
            attendance: any[];
            remarks: any[];
            distribution: any[];
            attendanceByMonth: any[];
        };
    } | null>(null);

    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [selectedStudent, setSelectedStudent] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getStatisticsData(selectedCourse, selectedStudent);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCourse, selectedStudent]);

    if (loading && !data) {
        return <LoadingSpinner message="Cargando estadísticas..." />;
    }

    if (!data) {
        return <div className="p-8 text-center text-destructive">Error al cargar estadísticas</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Estadísticas</h2>

                <div className="flex gap-4 w-full md:w-auto">
                    {/* Course Filter */}
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Todos los cursos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los cursos</SelectItem>
                            {data.courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Student Filter */}
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Todos los estudiantes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estudiantes</SelectItem>
                            {data.students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.charts.grades.length > 0
                                ? (data.charts.grades.reduce((acc, curr) => acc + curr.average, 0) / data.charts.grades.length).toFixed(2)
                                : "N/A"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Asistencias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.charts.attendance.reduce((acc, curr) => acc + curr.present, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.charts.remarks.reduce((acc, curr) => acc + curr.positive + curr.negative, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <StatisticsCharts data={data.charts} />
        </div>
    );
}
