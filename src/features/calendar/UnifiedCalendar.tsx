"use client";

import { useEffect, useState } from "react";
import { getCalendarEventsAction, getStudentsForTeacherAction } from "@/app/actions";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    CalendarBody,
    CalendarDate,
    CalendarDatePagination,
    CalendarDatePicker,
    CalendarHeader,
    CalendarItem,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
} from "@/components/ui/shadcn-io/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar as CalendarIcon,
    Clock,
    AlertCircle,
    CheckCircle,
    MessageSquareWarning,
    Award,
    Github,
    FileText,
    XCircle,
    AlertTriangle,
    Check,
    ChevronsUpDown,
    FileCheck,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2
} from "lucide-react";
import { es } from "date-fns/locale";
import { startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, format, isSameDay, startOfDay } from "date-fns";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function UnifiedCalendar() {
    const [events, setEvents] = useState<any[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // User session
    const { data: session } = useSession();
    const isTeacher = session?.user?.role === "teacher";

    // Filter
    const [filter, setFilter] = useState("all"); // all, activities, absences, remarks
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [openCombobox, setOpenCombobox] = useState(false);

    // Student selector (teacher only)
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [openStudentCombobox, setOpenStudentCombobox] = useState(false);

    // Details Dialog
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Day Events Dialog (for +X more)
    const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<number>(0);

    // View mode (day, week, month)
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch students if teacher
                if (isTeacher) {
                    const studentsData = await getStudentsForTeacherAction();
                    setStudents(studentsData);
                    // Set first student as default
                    if (studentsData.length > 0 && !selectedStudent) {
                        setSelectedStudent(studentsData[0].id);
                    }
                }

                // Fetch calendar events
                const studentIdParam = isTeacher && selectedStudent ? selectedStudent : undefined;
                const data = await getCalendarEventsAction(studentIdParam);
                // Ensure dates are Date objects and map title to name
                const formattedData = data.map((event: any) => ({
                    ...event,
                    name: event.title,
                    startAt: new Date(event.startAt),
                    endAt: new Date(event.endAt),
                }));
                setEvents(formattedData);
            } catch (error) {
                console.error("Failed to fetch calendar data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isTeacher, selectedStudent]);

    useEffect(() => {
        const filtered = events.filter(event => {
            // Filter by course if selected
            if (selectedCourse && event.details?.courseName !== selectedCourse) return false;

            if (filter === "all") return true;
            if (filter === "activities" && event.type === 'ACTIVITY') return true;
            if (filter === "absences" && event.type === 'ABSENCE') return true;
            if (filter === "remarks" && event.type === 'REMARK') return true;
            return false;
        });
        setFilteredEvents(filtered);
    }, [events, filter, selectedCourse]);

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setIsDialogOpen(true);
    };

    const handleShowMoreClick = (day: number, events: any[]) => {
        setSelectedDay(day);
        setSelectedDayEvents(events);
        setIsDayEventsDialogOpen(true);
    };

    // Derive unique courses and set first as default
    const courses = Array.from(new Set(events.map(e => e.details?.courseName).filter(Boolean))).map(name => ({
        value: name,
        label: name
    }));

    // Set first course as default if not set
    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            setSelectedCourse(courses[0].value);
        }
    }, [courses.length]);

    if (loading) {
        return <LoadingSpinner message="Cargando calendario..." />;
    }

    const earliestYear =
        events
            .map((feature) => feature.startAt.getFullYear())
            .sort()
            .at(0) ?? new Date().getFullYear();

    const latestYear =
        events
            .map((feature) => feature.endAt.getFullYear())
            .sort()
            .at(-1) ?? new Date().getFullYear() + 1;

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-md bg-background flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <RadioGroup defaultValue="all" onValueChange={setFilter} className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="cursor-pointer">Todos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="activities" id="activities" />
                        <Label htmlFor="activities" className="flex items-center gap-2 cursor-pointer">
                            <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
                            Actividades
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="absences" id="absences" />
                        <Label htmlFor="absences" className="flex items-center gap-2 cursor-pointer">
                            <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
                            Inasistencias
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remarks" id="remarks" />
                        <Label htmlFor="remarks" className="flex items-center gap-2 cursor-pointer">
                            <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
                            Observaciones
                        </Label>
                    </div>
                </RadioGroup>

                <div className="flex gap-2">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-[200px] justify-between"
                            >
                                {selectedCourse
                                    ? courses.find((course) => course.value === selectedCourse)?.label
                                    : "Seleccionar curso"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar curso..." />
                                <CommandList>
                                    <CommandEmpty>No se encontró el curso.</CommandEmpty>
                                    <CommandGroup>
                                        {courses.map((course) => (
                                            <CommandItem
                                                key={course.value}
                                                value={course.value}
                                                onSelect={(currentValue) => {
                                                    setSelectedCourse(currentValue);
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedCourse === course.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {course.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {isTeacher && (
                        <Popover open={openStudentCombobox} onOpenChange={setOpenStudentCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStudentCombobox}
                                    className="w-[200px] justify-between"
                                >
                                    {selectedStudent
                                        ? students.find((student) => student.id === selectedStudent)?.name
                                        : "Seleccionar estudiante"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar estudiante..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró el estudiante.</CommandEmpty>
                                        <CommandGroup>
                                            {students.map((student) => (
                                                <CommandItem
                                                    key={student.id}
                                                    value={student.id}
                                                    onSelect={(currentValue) => {
                                                        setSelectedStudent(currentValue);
                                                        setOpenStudentCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedStudent === student.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {student.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* View Selector */}
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week' | 'month')} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="day">Día</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="month">Mes</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCompact(!isCompact)}
                        title={isCompact ? "Tamaño normal" : "Disminuir tamaño"}
                    >
                        {isCompact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Calendar Views */}
            {viewMode === 'month' && (
                <div className={cn(
                    "w-full border rounded-md overflow-hidden bg-background transition-all duration-300",
                    isCompact && "max-w-5xl mx-auto"
                )}>
                    <CalendarProvider locale={es as any}>
                        <CalendarDate>
                            <CalendarDatePicker>
                                <CalendarMonthPicker />
                                <CalendarYearPicker end={latestYear} start={earliestYear} />
                            </CalendarDatePicker>
                            <CalendarDatePagination />
                        </CalendarDate>
                        <CalendarHeader />
                        <CalendarBody features={filteredEvents} onShowMore={handleShowMoreClick}>
                            {({ feature }) => {
                                const getEventIcon = () => {
                                    if (feature.type === 'ACTIVITY') {
                                        return feature.details?.activityType === 'GITHUB'
                                            ? <Github className="h-3 w-3" />
                                            : <FileText className="h-3 w-3" />;
                                    }
                                    if (feature.type === 'ABSENCE') {
                                        if (feature.details?.status === 'LATE') return <Clock className="h-3 w-3" />;
                                        if (feature.details?.status === 'EXCUSED') return <FileCheck className="h-3 w-3" />;
                                        return <XCircle className="h-3 w-3" />;
                                    }
                                    if (feature.type === 'REMARK') {
                                        return feature.details?.type === 'COMMENDATION'
                                            ? <Award className="h-3 w-3" />
                                            : <AlertTriangle className="h-3 w-3" />;
                                    }
                                    return null;
                                };

                                return (
                                    <TooltipProvider key={feature.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div onClick={() => handleEventClick(feature)} className="cursor-pointer mt-1">
                                                    <div
                                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] leading-tight text-white w-full overflow-hidden"
                                                        style={{
                                                            backgroundColor: feature.status.color,
                                                        }}
                                                    >
                                                        {getEventIcon()}
                                                        <span className="truncate flex-1">{feature.name}</span>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{feature.name}</p>
                                                <p className="text-xs text-muted-foreground">{feature.details?.courseName}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            }}
                        </CalendarBody>
                    </CalendarProvider>
                </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
                <div className={cn(
                    "w-full border rounded-md bg-background p-4 transition-all duration-300",
                    isCompact && "max-w-3xl mx-auto"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-lg font-semibold">
                            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </h3>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {filteredEvents
                            .filter(event => isSameDay(new Date(event.endAt), selectedDate))
                            .map((event) => {
                                const getEventIcon = () => {
                                    if (event.type === 'ACTIVITY') {
                                        return event.details?.activityType === 'GITHUB'
                                            ? <Github className="h-4 w-4" />
                                            : <FileText className="h-4 w-4" />;
                                    }
                                    if (event.type === 'ABSENCE') {
                                        if (event.details?.status === 'LATE') return <Clock className="h-4 w-4" />;
                                        if (event.details?.status === 'EXCUSED') return <FileCheck className="h-4 w-4" />;
                                        return <XCircle className="h-4 w-4" />;
                                    }
                                    if (event.type === 'REMARK') {
                                        return event.details?.type === 'COMMENDATION'
                                            ? <Award className="h-4 w-4" />
                                            : <AlertTriangle className="h-4 w-4" />;
                                    }
                                    return null;
                                };

                                const getTypeBadge = () => {
                                    if (event.type === 'ACTIVITY') {
                                        return <Badge className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white">Actividad</Badge>;
                                    }
                                    if (event.type === 'ABSENCE') {
                                        return <Badge className="bg-[#ef4444] hover:bg-[#ef4444]/90 text-white">Inasistencia</Badge>;
                                    }
                                    if (event.type === 'REMARK') {
                                        return <Badge className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white">Observación</Badge>;
                                    }
                                    return null;
                                };

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => handleEventClick(event)}
                                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                                    >
                                        <div
                                            className="flex items-center justify-center w-10 h-10 rounded-lg text-white"
                                            style={{ backgroundColor: event.status.color }}
                                        >
                                            {getEventIcon()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="font-medium truncate">{event.title}</div>
                                                {getTypeBadge()}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {event.details?.courseName}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        {filteredEvents.filter(event => isSameDay(new Date(event.endAt), selectedDate)).length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No hay eventos para este día
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
                <div className={cn(
                    "w-full border rounded-md bg-background p-4 transition-all duration-300",
                    isCompact && "max-w-5xl mx-auto"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-lg font-semibold">
                            {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "d MMM", { locale: es })} - {format(endOfWeek(selectedDate, { weekStartsOn: 0 }), "d MMM yyyy", { locale: es })}
                        </h3>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => {
                            const dayDate = addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), index);
                            const dayEvents = filteredEvents.filter(event =>
                                isSameDay(new Date(event.endAt), dayDate)
                            );

                            return (
                                <div key={index} className="border rounded-lg p-2 min-h-[200px]">
                                    <div className="font-semibold text-sm mb-2 text-center">
                                        {format(dayDate, "EEE d", { locale: es })}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => {
                                            const getEventIcon = () => {
                                                if (event.type === 'ACTIVITY') {
                                                    return event.details?.activityType === 'GITHUB'
                                                        ? <Github className="h-3 w-3" />
                                                        : <FileText className="h-3 w-3" />;
                                                }
                                                if (event.type === 'ABSENCE') {
                                                    if (event.details?.status === 'LATE') return <Clock className="h-3 w-3" />;
                                                    if (event.details?.status === 'EXCUSED') return <FileCheck className="h-3 w-3" />;
                                                    return <XCircle className="h-3 w-3" />;
                                                }
                                                if (event.type === 'REMARK') {
                                                    return event.details?.type === 'COMMENDATION'
                                                        ? <Award className="h-3 w-3" />
                                                        : <AlertTriangle className="h-3 w-3" />;
                                                }
                                                return null;
                                            };

                                            return (
                                                <TooltipProvider key={event.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div onClick={() => handleEventClick(event)} className="cursor-pointer">
                                                                <div
                                                                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] leading-tight text-white w-full overflow-hidden"
                                                                    style={{ backgroundColor: event.status.color }}
                                                                >
                                                                    {getEventIcon()}
                                                                    <span className="truncate flex-1">{event.name}</span>
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{event.name}</p>
                                                            <p className="text-xs text-muted-foreground">{event.details?.courseName}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDay(dayDate.getDate());
                                                    setSelectedDayEvents(dayEvents);
                                                    setIsDayEventsDialogOpen(true);
                                                }}
                                                className="block text-muted-foreground text-xs hover:text-primary hover:underline cursor-pointer transition-colors w-full text-left px-2"
                                            >
                                                +{dayEvents.length - 3} more
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEvent?.type === 'ACTIVITY' && (
                                selectedEvent.details.activityType === 'GITHUB' ? <Github className="h-5 w-5 text-black" /> : <FileText className="h-5 w-5 text-blue-500" />
                            )}
                            {selectedEvent?.type === 'ABSENCE' && (
                                selectedEvent.details.status === 'LATE' ? <Clock className="h-5 w-5 text-yellow-500" /> :
                                    selectedEvent.details.status === 'EXCUSED' ? <FileCheck className="h-5 w-5 text-green-500" /> :
                                        <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {selectedEvent?.type === 'REMARK' && (
                                selectedEvent.details.type === 'COMMENDATION' ? <Award className="h-5 w-5 text-yellow-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.startAt.toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedEvent?.details?.courseName && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Curso</Label>
                                <div className="font-medium">{selectedEvent.details.courseName}</div>
                            </div>
                        )}

                        {selectedEvent?.type === 'ACTIVITY' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Fecha de Apertura</Label>
                                        <div className="text-sm">
                                            {selectedEvent.details.openDate
                                                ? new Date(selectedEvent.details.openDate).toLocaleDateString()
                                                : "No definida"}
                                        </div>
                                    </div>
                                    {(selectedEvent.details.activityType !== 'MANUAL' || selectedEvent.details.requiresSubmission) && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Fecha de Vencimiento</Label>
                                            <div className="text-sm">
                                                {new Date(selectedEvent.details.deadline).toLocaleDateString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Peso</Label>
                                    <Badge variant="outline">{Number(selectedEvent.details.weight).toFixed(1)}%</Badge>
                                </div>
                                {selectedEvent.details.url && (
                                    <Button asChild className="w-full mt-2">
                                        <Link href={selectedEvent.details.url}>Ir a la actividad</Link>
                                    </Button>
                                )}
                            </>
                        )}

                        {selectedEvent?.type === 'ABSENCE' && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Estado</Label>
                                    <div>
                                        {selectedEvent.details.status === 'ABSENT' && <Badge variant="destructive">Ausente (Sin Soporte)</Badge>}
                                        {selectedEvent.details.status === 'LATE' && <Badge className="bg-yellow-500 hover:bg-yellow-600">Tarde</Badge>}
                                        {selectedEvent.details.status === 'EXCUSED' && <Badge className="bg-green-500 hover:bg-green-600">Excusado (Con Soporte)</Badge>}
                                    </div>
                                </div>
                                {selectedEvent.details.arrivalTime && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Hora de Llegada</Label>
                                        <div className="text-sm">{new Date(selectedEvent.details.arrivalTime).toLocaleTimeString()}</div>
                                    </div>
                                )}
                                {selectedEvent.details.justification && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Justificación</Label>
                                        <div className="text-sm italic">"{selectedEvent.details.justification}"</div>
                                    </div>
                                )}
                                {selectedEvent.details.justificationUrl && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Soporte</Label>
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={selectedEvent.details.justificationUrl} target="_blank" rel="noopener noreferrer">
                                                Ver Documento de Soporte
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {selectedEvent?.type === 'REMARK' && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                                    <div>
                                        {selectedEvent.details.type === 'ATTENTION' ? (
                                            <Badge variant="destructive">Llamado de Atención</Badge>
                                        ) : (
                                            <Badge className="bg-green-500 hover:bg-green-600">Felicitación</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Descripción</Label>
                                    <div className="text-sm">{selectedEvent.details.description}</div>
                                </div>
                            </>
                        )}

                        {selectedEvent?.type === 'COURSE_DATE' && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Detalle</Label>
                                <div className="text-sm">{selectedEvent.details.description}</div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDayEventsDialogOpen} onOpenChange={setIsDayEventsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Eventos del día {selectedDay}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDayEvents.length} evento{selectedDayEvents.length !== 1 ? 's' : ''} en total
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4">
                        {selectedDayEvents.map((event) => {
                            const getEventIcon = () => {
                                if (event.type === 'ACTIVITY') {
                                    return event.details?.activityType === 'GITHUB'
                                        ? <Github className="h-4 w-4" />
                                        : <FileText className="h-4 w-4" />;
                                }
                                if (event.type === 'ABSENCE') {
                                    if (event.details?.status === 'LATE') return <Clock className="h-4 w-4" />;
                                    if (event.details?.status === 'EXCUSED') return <FileCheck className="h-4 w-4" />;
                                    return <XCircle className="h-4 w-4" />;
                                }
                                if (event.type === 'REMARK') {
                                    return event.details?.type === 'COMMENDATION'
                                        ? <Award className="h-4 w-4" />
                                        : <AlertTriangle className="h-4 w-4" />;
                                }
                                return null;
                            };

                            const getTypeBadge = () => {
                                if (event.type === 'ACTIVITY') {
                                    return (
                                        <Badge className="bg-[#22c55e] hover:bg-[#22c55e]/90 text-white">
                                            Actividad
                                        </Badge>
                                    );
                                }
                                if (event.type === 'ABSENCE') {
                                    return (
                                        <Badge className="bg-[#ef4444] hover:bg-[#ef4444]/90 text-white">
                                            Inasistencia
                                        </Badge>
                                    );
                                }
                                if (event.type === 'REMARK') {
                                    return (
                                        <Badge className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white">
                                            Observación
                                        </Badge>
                                    );
                                }
                                return null;
                            };

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => {
                                        setIsDayEventsDialogOpen(false);
                                        handleEventClick(event);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                                >
                                    <div
                                        className="flex items-center justify-center w-10 h-10 rounded-lg text-white"
                                        style={{ backgroundColor: event.status.color }}
                                    >
                                        {getEventIcon()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-medium truncate">{event.title}</div>
                                            {getTypeBadge()}
                                        </div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {event.details?.courseName}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {event.startAt.toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsDayEventsDialogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
