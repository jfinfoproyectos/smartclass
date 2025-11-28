"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Label, Bar, BarChart } from "recharts";

interface StatisticsChartsProps {
    data: {
        grades: any[];
        attendance: any[];
        remarks: any[];
        distribution?: any[];
        attendanceByMonth?: any[];
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
            {/* Academic Performance - Area Chart */}
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Rendimiento Académico</CardTitle>
                    <CardDescription>Promedio de calificaciones por actividad a lo largo del tiempo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart data={data.grades} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillGrades" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-grades)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-grades)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 5]} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="average"
                                    stroke="var(--color-grades)"
                                    fillOpacity={1}
                                    fill="url(#fillGrades)"
                                    name="Promedio"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Overview - Stacked Area Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Asistencia</CardTitle>
                    <CardDescription>Tendencias de asistencia, inasistencia y tardanzas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart data={data.attendance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-present)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-absent)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-absent)" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillLate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-late)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-late)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="present" stackId="1" stroke="var(--color-present)" fill="url(#fillPresent)" name="Asistencias" />
                                <Area type="monotone" dataKey="late" stackId="1" stroke="var(--color-late)" fill="url(#fillLate)" name="Tardanzas" />
                                <Area type="monotone" dataKey="absent" stackId="1" stroke="var(--color-absent)" fill="url(#fillAbsent)" name="Inasistencias" />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Observations - Area Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Observaciones</CardTitle>
                    <CardDescription>Comparativa de observaciones positivas y negativas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart data={data.remarks} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillPositive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-positive)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-positive)" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillNegative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-negative)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-negative)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="positive" stackId="1" stroke="var(--color-positive)" fill="url(#fillPositive)" name="Positivas" />
                                <Area type="monotone" dataKey="negative" stackId="1" stroke="var(--color-negative)" fill="url(#fillNegative)" name="Negativas" />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
            {/* Grade Distribution - Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Calificaciones</CardTitle>
                    <CardDescription>Clasificación por rangos de desempeño</CardDescription>
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
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
                                                            Total
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

            {/* Attendance Breakdown - Multiple Bar Chart */}
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Detalle de Asistencia Mensual</CardTitle>
                    <CardDescription>Comparativa de inasistencias, tardanzas y justificaciones por mes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={data.attendanceByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="absent" fill="var(--destructive)" radius={[4, 4, 0, 0]} name="Inasistencias" />
                                <Bar dataKey="late" fill="var(--chart-4)" radius={[4, 4, 0, 0]} name="Tardanzas" />
                                <Bar dataKey="excused" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Justificadas" />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
