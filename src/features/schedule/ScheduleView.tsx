"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScheduleViewAction } from "@/app/actions";
import { useSession } from "@/lib/auth-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, startOfMonth, endOfMonth, getDaysInMonth, getDay, startOfWeek, endOfWeek, addDays as addDaysFn, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper to get day index from DayOfWeek enum
const getDayIndex = (dayOfWeek: string): number => {
    const days = {
        MONDAY: 0,
        TUESDAY: 1,
        WEDNESDAY: 2,
        THURSDAY: 3,
        FRIDAY: 4,
        SATURDAY: 5,
        SUNDAY: 6
    };
    return days[dayOfWeek as keyof typeof days] ?? 0;
};

// Helper to get Spanish day name
const getDayName = (index: number): string => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return days[index];
};

// Helper to get time period color
const getTimeColor = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);

    // Morning: 06:00 - 11:59
    if (hour >= 6 && hour < 12) {
        return {
            bg: 'bg-blue-500',
            hover: 'hover:bg-blue-600',
            text: 'text-white'
        };
    }

    // Afternoon: 12:00 - 17:59
    if (hour >= 12 && hour < 18) {
        return {
            bg: 'bg-yellow-500',
            hover: 'hover:bg-yellow-600',
            text: 'text-gray-900'
        };
    }

    // Night: 18:00 - 23:59
    return {
        bg: 'bg-slate-700 dark:bg-slate-600',
        hover: 'hover:bg-slate-800 dark:hover:bg-slate-700',
        text: 'text-white'
    };
};

// Helper to calculate duration in hours
const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    return (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
};

// Helper to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
};

// Helper to add days to date
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Helper to check if date is within course range
const isDateInCourseRange = (date: Date, course: any): boolean => {
    if (course.startDate && new Date(course.startDate) > date) return false;
    if (course.endDate && new Date(course.endDate) < date) return false;
    return true;
};

export function ScheduleView() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);

    // Get user session to determine role
    const { data: session } = useSession();
    const userRole = session?.user?.role || "student";

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const data = await getScheduleViewAction();
                setCourses(data);
            } catch (error) {
                console.error("Failed to fetch schedules", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    // Generate schedule grid for current week
    const generateScheduleGrid = () => {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
        const weekDays = Array.from({ length: 7 }, (_, i) => addDaysFn(weekStart, i));

        const grid: Record<number, any[]> = {};

        courses.forEach(course => {
            course.schedules?.forEach((schedule: any) => {
                const dayIndex = getDayIndex(schedule.dayOfWeek);
                const date = weekDays[dayIndex];

                // Check if this specific date is within course range
                if (!isDateInCourseRange(date, course)) return;

                if (!grid[dayIndex]) grid[dayIndex] = [];

                grid[dayIndex].push({
                    course: course.title,
                    courseId: course.id,
                    teacher: course.teacher?.name,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    color: getTimeColor(schedule.startTime),
                    duration: calculateDuration(schedule.startTime, schedule.endTime),
                    fullCourseData: course
                });
            });
        });

        return grid;
    };

    const scheduleGrid = generateScheduleGrid();
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDaysFn(weekStart, i));

    const handlePrevious = () => {
        if (viewMode === 'day') setSelectedDate(addDaysFn(selectedDate, -1));
        if (viewMode === 'week') setSelectedDate(addDaysFn(selectedDate, -7));
        if (viewMode === 'month') setSelectedDate(subMonths(selectedDate, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setSelectedDate(addDaysFn(selectedDate, 1));
        if (viewMode === 'week') setSelectedDate(addDaysFn(selectedDate, 7));
        if (viewMode === 'month') setSelectedDate(addMonths(selectedDate, 1));
    };

    const getDateLabel = () => {
        if (viewMode === 'day') {
            return format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });
        }
        if (viewMode === 'week') {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
        }
        if (viewMode === 'month') {
            return format(selectedDate, "MMMM yyyy", { locale: es });
        }
        return "";
    };

    const handleCourseClick = (scheduleItem: any) => {
        setSelectedCourse(scheduleItem.fullCourseData);
        setIsDialogOpen(true);
    };

    if (loading) {
        return <LoadingSpinner message="Cargando horarios..." />;
    }

    return (
        <div className="space-y-4 p-6">
            {/* Header and View Selector */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Horario</h2>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
                    <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
                        <TabsTrigger value="day">Día</TabsTrigger>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                        <TabsTrigger value="month">Mes</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsCompact(!isCompact)}
                        >
                            {isCompact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isCompact ? "Tamaño normal" : "Disminuir tamaño"}</p>
                    </TooltipContent>
                </Tooltip>

                <div className="flex flex-wrap items-center gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={handlePrevious}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <span className="text-sm font-medium min-w-[180px] sm:min-w-[200px] text-center capitalize px-2">
                        {getDateLabel()}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNext}>
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Day View */}
            {viewMode === 'day' && (
                <div className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-300",
                    isCompact && "max-w-3xl mx-auto"
                )}>
                    <div className="grid grid-cols-1 border-b bg-muted/50">
                        <div className="p-3 text-center font-semibold text-sm">
                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                        </div>
                    </div>
                    {/* Time Slots for Day */}
                    {(() => {
                        const slots = [];
                        for (let hour = 6; hour < 23; hour++) {
                            for (let min = 0; min < 60; min += 15) {
                                slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
                            }
                        }
                        const SLOT_HEIGHT_CLASS = "h-5"; // Standard height
                        const SLOT_HEIGHT_PX = 20;

                        return slots.map((time) => {
                            const isHourStart = time.endsWith(':00');
                            const dayNameEnglish = format(selectedDate, 'EEEE').toUpperCase();
                            const dayIdx = getDayIndex(dayNameEnglish);

                            const daySchedules = scheduleGrid[dayIdx] || [];
                            const scheduleAtTime = daySchedules.find(s => s.startTime === time);

                            return (
                                <div key={time} className={`grid grid-cols-[80px_1fr] border-b last:border-b-0 ${SLOT_HEIGHT_CLASS} ${isHourStart ? 'bg-muted/5' : ''}`}>
                                    <div className={`px-2 text-xs border-r font-medium flex items-center justify-end ${isHourStart ? 'text-foreground font-bold' : 'text-muted-foreground/40'}`}>
                                        {isHourStart ? time : ''}
                                    </div>
                                    <div className="relative group">
                                        <div className={`absolute inset-0 ${isHourStart ? 'border-t border-muted-foreground/30' : 'border-t border-muted/10'}`}></div>
                                        {scheduleAtTime && (
                                            <div
                                                onClick={() => handleCourseClick(scheduleAtTime)}
                                                className="absolute inset-x-0 top-0 z-10 px-2 py-1"
                                                style={{ zIndex: 10 }}
                                            >
                                                <div
                                                    className={`${scheduleAtTime.color.bg} ${scheduleAtTime.color.hover} ${scheduleAtTime.color.text} rounded-md p-2 cursor-pointer transition-colors shadow-sm h-full overflow-hidden`}
                                                    style={{
                                                        height: `${(scheduleAtTime.duration * 60 / 15) * SLOT_HEIGHT_PX - 4}px`,
                                                    }}
                                                >
                                                    <div className="font-bold">{scheduleAtTime.course}</div>
                                                    <div className="text-sm opacity-90">{scheduleAtTime.startTime} - {scheduleAtTime.endTime}</div>
                                                    {scheduleAtTime.teacher && <div className="text-sm opacity-80">{scheduleAtTime.teacher}</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
                <div className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-300",
                    isCompact && "max-w-5xl mx-auto"
                )}>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-8 border-b bg-muted/50">
                                <div className="p-3 font-semibold text-sm border-r">Hora</div>
                                {weekDays.map((day, index) => (
                                    <div key={index} className="p-3 text-center font-semibold text-sm border-r last:border-r-0">
                                        <div>{getDayName(index)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots */}
                            {(() => {
                                const slots = [];
                                for (let hour = 6; hour < 23; hour++) {
                                    for (let min = 0; min < 60; min += 15) {
                                        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
                                    }
                                }
                                const SLOT_HEIGHT_CLASS = "h-5";
                                const SLOT_HEIGHT_PX = 20;

                                return slots.map((time) => {
                                    const isHourStart = time.endsWith(':00');
                                    return (
                                        <div key={time} className={`grid grid-cols-8 border-b last:border-b-0 ${SLOT_HEIGHT_CLASS} ${isHourStart ? 'bg-muted/5' : ''}`}>
                                            <div className={`px-2 text-xs border-r font-medium flex items-center justify-end ${isHourStart ? 'text-foreground font-bold' : 'text-muted-foreground/40'}`}>
                                                {isHourStart ? time : ''}
                                            </div>
                                            {weekDays.map((_, dayIndex) => {
                                                const daySchedules = scheduleGrid[dayIndex] || [];
                                                const scheduleAtTime = daySchedules.find(s => s.startTime === time);
                                                return (
                                                    <div key={dayIndex} className="border-r last:border-r-0 relative group">
                                                        <div className={`absolute inset-0 ${isHourStart ? 'border-t border-muted-foreground/30' : 'border-t border-muted/10'}`}></div>
                                                        {scheduleAtTime && (
                                                            <div
                                                                onClick={() => handleCourseClick(scheduleAtTime)}
                                                                className="absolute inset-x-0 top-0 z-10 px-0.5"
                                                            >
                                                                <div
                                                                    className={`${scheduleAtTime.color.bg} ${scheduleAtTime.color.hover} ${scheduleAtTime.color.text} rounded-sm text-[10px] cursor-pointer transition-colors overflow-hidden px-1 py-0.5 leading-tight shadow-sm`}
                                                                    style={{
                                                                        height: `${(scheduleAtTime.duration * 60 / 15) * SLOT_HEIGHT_PX - 1}px`,
                                                                    }}
                                                                    title={`${scheduleAtTime.course}\n${scheduleAtTime.startTime} - ${scheduleAtTime.endTime}`}
                                                                >
                                                                    <div className="font-bold truncate">{scheduleAtTime.course}</div>
                                                                    <div className="opacity-90 truncate">
                                                                        {scheduleAtTime.startTime} - {scheduleAtTime.endTime}
                                                                    </div>
                                                                    {userRole === 'student' && scheduleAtTime.teacher && (
                                                                        <div className="opacity-80 truncate text-[9px] mt-0.5">
                                                                            {scheduleAtTime.teacher}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Month View */}
            {viewMode === 'month' && (
                <div className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-300",
                    isCompact && "max-w-5xl mx-auto"
                )}>
                    <div className="grid grid-cols-7 border-b bg-muted/50">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                            <div key={day} className="p-3 text-center font-semibold text-sm border-r last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {(() => {
                            const monthStart = startOfMonth(selectedDate);
                            const monthEnd = endOfMonth(selectedDate);
                            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                            const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                            const days = [];
                            let day = startDate;
                            while (day <= endDate) {
                                days.push(day);
                                day = addDaysFn(day, 1);
                            }

                            return days.map((day, index) => {
                                const isSameMonth = day.getMonth() === selectedDate.getMonth();
                                const dayNameEnglish = format(day, 'EEEE').toUpperCase();
                                const dayIdx = getDayIndex(dayNameEnglish);

                                const daySchedules = courses.flatMap(course =>
                                    (course.schedules || [])
                                        .filter((s: any) => getDayIndex(s.dayOfWeek) === dayIdx)
                                        .filter(() => isDateInCourseRange(day, course))
                                        .map((s: any) => ({
                                            ...s,
                                            course: course.title,
                                            fullCourseData: course,
                                            color: getTimeColor(s.startTime)
                                        }))
                                ).sort((a, b) => a.startTime.localeCompare(b.startTime));

                                return (
                                    <div key={index} className={`min-h-[120px] border-b border-r p-2 ${!isSameMonth ? 'bg-muted/20 text-muted-foreground' : ''}`}>
                                        <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
                                        <div className="space-y-1">
                                            {daySchedules.map((schedule, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handleCourseClick(schedule)}
                                                    className={`${schedule.color.bg} ${schedule.color.hover} ${schedule.color.text} text-[10px] rounded px-1 py-0.5 truncate cursor-pointer`}
                                                    title={`${schedule.course} (${schedule.startTime})`}
                                                >
                                                    <span className="font-bold">{schedule.startTime}</span> {schedule.course}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Mañana (06:00-11:59)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Tarde (12:00-17:59)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-700 dark:bg-slate-600 rounded"></div>
                    <span>Noche (18:00-23:59)</span>
                </div>
            </div>

            {/* Course Information Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCourse?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedCourse?.description || "Sin descripción disponible"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedCourse?.teacher && (
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Profesor</label>
                                <div className="font-medium">{selectedCourse.teacher.name}</div>
                            </div>
                        )}
                        {selectedCourse?.startDate && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Fecha de Inicio</label>
                                    <div className="text-sm">{new Date(selectedCourse.startDate).toLocaleDateString('es-ES')}</div>
                                </div>
                                {selectedCourse?.endDate && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Fecha de Fin</label>
                                        <div className="text-sm">{new Date(selectedCourse.endDate).toLocaleDateString('es-ES')}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedCourse?.schedules && selectedCourse.schedules.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Horarios</label>
                                <div className="space-y-2">
                                    {selectedCourse.schedules.map((schedule: any, index: number) => (
                                        <Badge key={index} variant="outline" className="mr-2">
                                            {getDayName(getDayIndex(schedule.dayOfWeek))} {schedule.startTime} - {schedule.endTime}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
