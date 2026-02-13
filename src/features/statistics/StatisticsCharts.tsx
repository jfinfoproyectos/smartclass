"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Label, Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCalendarDate } from "@/lib/dateUtils";

interface StatisticsChartsProps {
    data: {
        activityPerformance: any[];
        distribution: any[];
        attendanceTrends: any[];
    };
}

const chartConfig = {
    grades: {
        label: "Promedio",
        color: "var(--primary)",
    },
    present: {
        label: "Asistencias",
        color: "var(--chart-2)",
    },
    absent: {
        label: "Inasistencias",
        color: "var(--destructive)",
    },
    late: {
        label: "Tardanzas",
        color: "var(--chart-4)",
    },
    positive: {
        label: "Positivas",
        color: "var(--chart-2)",
    },
    negative: {
        label: "Negativas",
        color: "var(--destructive)",
    },
};

export function StatisticsCharts({ data }: StatisticsChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Performance - Bar Chart */}
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Rendimiento por Actividad</CardTitle>
                    <CardDescription>Promedio de calificaciones por cada actividad del curso</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={data.activityPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="activity"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 5]} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="average"
                                    fill="var(--color-grades)"
                                    radius={[4, 4, 0, 0]}
                                    name="Promedio"
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Trends - Area Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Asistencia</CardTitle>
                    <CardDescription>Porcentaje de asistencia a lo largo del tiempo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart data={data.attendanceTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-present)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => formatCalendarDate(value, "dd MMM")}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 100]} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="var(--color-present)"
                                    fill="url(#fillPresent)"
                                    name="% Asistencia"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Grade Distribution - Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Calificaciones</CardTitle>
                    <CardDescription>Clasificación de estudiantes por promedio</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full mx-auto aspect-square max-h-[300px]">
                            <PieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={data.distribution}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    {data.distribution?.map((entry: any, index: number) => (
                                        <Cell key={`cell - ${index} `} fill={entry.fill} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {data.distribution?.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Estudiantes
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
