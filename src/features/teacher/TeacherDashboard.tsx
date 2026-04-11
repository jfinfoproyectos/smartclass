"use client";

import { useState, useMemo } from "react";
import { CourseManager } from "./CourseManager";
import { EnrollmentRequests } from "./EnrollmentRequests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { createCourseAction, updateCourseAction, cloneCourseAction } from "@/app/actions";

interface TeacherDashboardProps {
    courses: any[];
    pendingEnrollments: any[];
    stats: {
        pendingEnrollmentsCount: number;
        pendingGradingCount: number;
        activeCoursesCount: number;
        totalStudentsCount: number;
        recentPendingGrading: any[];
    };
    currentDate?: string;
}

export function TeacherDashboard({ courses, pendingEnrollments, stats, currentDate }: TeacherDashboardProps) {
    const [activeTab, setActiveTab] = useState("courses");
    const [courseFilter, setCourseFilter] = useState("active");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<any>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [schedules, setSchedules] = useState<any[]>([]);
    
    // New Schedule State
    const [newDayOfWeek, setNewDayOfWeek] = useState("");
    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");

    const now = currentDate ? new Date(currentDate) : new Date();
    const activeCoursesCount = courses.filter(course => !course.endDate || new Date(course.endDate) >= now).length;
    const archivedCoursesCount = courses.filter(course => course.endDate && new Date(course.endDate) < now).length;

    const handleAddSchedule = () => {
        if (newDayOfWeek && newStartTime && newEndTime) {
            setSchedules([...schedules, { dayOfWeek: newDayOfWeek, startTime: newStartTime, endTime: newEndTime }]);
            setNewDayOfWeek("");
            setNewStartTime("");
            setNewEndTime("");
        }
    };

    const handleRemoveSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    const getDayLabel = (day: string) => {
        const days: Record<string, string> = {
            MONDAY: "Lunes",
            TUESDAY: "Martes",
            WEDNESDAY: "Miércoles",
            THURSDAY: "Jueves",
            FRIDAY: "Viernes",
            SATURDAY: "Sábado",
            SUNDAY: "Domingo",
        };
        return days[day] || day;
    };

    const openCreateDialog = () => {
        setEditCourse(null);
        setIsCloning(false);
        setSchedules([]);
        setIsDialogOpen(true);
    };

    const openEditDialog = (course: any) => {
        setEditCourse(course);
        setIsCloning(false);
        setSchedules(course.schedules || []);
        setIsDialogOpen(true);
    };

    const openCloneDialog = (course: any) => {
        setEditCourse(course);
        setIsCloning(true);
        setSchedules(course.schedules || []);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex-1 space-y-8 p-4 sm:p-6 md:p-8 pt-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Panel de Control
                </h2>
                <p className="text-muted-foreground">
                    Bienvenido, gestiona tus cursos y revisa el progreso de tus estudiantes.
                </p>
            </div>

            <Tabs id="teacher-dashboard-tabs" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex items-center justify-between gap-4 bg-muted/20 p-2 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="courses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Mis Cursos ({courses.length})
                            </TabsTrigger>
                            <TabsTrigger value="enrollments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
                                Solicitudes
                                {stats.pendingEnrollmentsCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 px-1.5 h-4 min-w-[1rem] flex items-center justify-center text-[10px]">
                                        {stats.pendingEnrollmentsCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        {activeTab === "courses" && (
                            <>
                                <div className="h-6 w-[1px] bg-border mx-2 hidden lg:block" />
                                <h3 className="text-lg font-bold text-foreground/80 hidden lg:block">Gestión de Cursos</h3>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === "courses" && (
                            <>
                                <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                                    <button
                                        onClick={() => setCourseFilter("active")}
                                        className={`px-4 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-md ${
                                            courseFilter === "active" 
                                                ? "bg-background shadow-sm text-foreground" 
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Activos ({activeCoursesCount})
                                    </button>
                                    <button
                                        onClick={() => setCourseFilter("archived")}
                                        className={`px-4 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-md ${
                                            courseFilter === "archived" 
                                                ? "bg-background shadow-sm text-foreground" 
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Archivados ({archivedCoursesCount})
                                    </button>
                                </div>
                                <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />
                                
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" onClick={openCreateDialog} className="shadow-md hover:shadow-lg transition-all active:scale-95">
                                            <Plus className="mr-2 h-4 w-4" /> 
                                            <span className="hidden sm:inline">Crear Curso</span>
                                            <span className="sm:hidden">Nuevo</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full max-w-[95vw] sm:max-w-7xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-xl">
                                        <form action={async (formData) => {
                                            formData.append("schedules", JSON.stringify(schedules));

                                            if (isCloning && editCourse) {
                                                formData.append("sourceCourseId", editCourse.id);
                                                await cloneCourseAction(formData);
                                            } else if (editCourse) {
                                                formData.append("courseId", editCourse.id);
                                                await updateCourseAction(formData);
                                            } else {
                                                await createCourseAction(formData);
                                            }
                                            setIsDialogOpen(false);
                                            setEditCourse(null);
                                            setIsCloning(false);
                                            setSchedules([]);
                                        }}>
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl">
                                                    {isCloning ? "Clonar Curso" : (editCourse ? "Editar Curso" : "Crear Nuevo Curso")}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {isCloning
                                                        ? "Configura los detalles del nuevo curso basado en el original."
                                                        : (editCourse ? "Modifica los detalles del curso." : "Ingresa los detalles del nuevo curso.")}
                                                </DialogDescription>
                                            </DialogHeader>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Título del Curso *</Label>
                                                        <Input id="title" name="title" required defaultValue={editCourse?.title} placeholder="Ej: Introducción a la Programación" className="bg-muted/30 focus-visible:ring-primary/50" />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Descripción</Label>
                                                        <Textarea id="description" name="description" defaultValue={editCourse?.description || ""} placeholder="Describe brevemente el contenido y objetivos del curso..." rows={5} className="bg-muted/30 focus-visible:ring-primary/50 resize-none" />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="externalUrl" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Enlace Externo</Label>
                                                        <Input id="externalUrl" name="externalUrl" type="url" defaultValue={editCourse?.externalUrl || ""} placeholder="https://ejemplo.com/recursos" className="bg-muted/30 focus-visible:ring-primary/50" />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="startDate" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Fecha Inicio</Label>
                                                            <Input id="startDate" name="startDate" type="date" defaultValue={editCourse?.startDate ? format(new Date(editCourse.startDate), "yyyy-MM-dd") : ''} className="bg-muted/30" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="endDate" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Fecha Fin</Label>
                                                            <Input id="endDate" name="endDate" type="date" defaultValue={editCourse?.endDate ? format(new Date(editCourse.endDate), "yyyy-MM-dd") : ''} className="bg-muted/30" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column - Schedule */}
                                                <div className="space-y-6 bg-muted/10 p-4 sm:p-6 rounded-2xl border border-border/50">
                                                    <Label className="text-lg font-bold flex items-center gap-2">
                                                        <span className="bg-primary/10 p-1 rounded-md">📅</span>
                                                        Horarios
                                                    </Label>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-muted-foreground">Día</Label>
                                                                <Select value={newDayOfWeek} onValueChange={setNewDayOfWeek}>
                                                                    <SelectTrigger className="bg-background">
                                                                        <SelectValue placeholder="Día" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="MONDAY">Lunes</SelectItem>
                                                                        <SelectItem value="TUESDAY">Martes</SelectItem>
                                                                        <SelectItem value="WEDNESDAY">Miércoles</SelectItem>
                                                                        <SelectItem value="THURSDAY">Jueves</SelectItem>
                                                                        <SelectItem value="FRIDAY">Viernes</SelectItem>
                                                                        <SelectItem value="SATURDAY">Sábado</SelectItem>
                                                                        <SelectItem value="SUNDAY">Domingo</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="space-y-2 flex-1">
                                                                    <Label className="text-xs font-semibold text-muted-foreground">Inicio</Label>
                                                                    <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="bg-background" />
                                                                </div>
                                                                <div className="space-y-2 flex-1">
                                                                    <Label className="text-xs font-semibold text-muted-foreground">Fin</Label>
                                                                    <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="bg-background" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button type="button" onClick={handleAddSchedule} disabled={!newDayOfWeek || !newStartTime || !newEndTime} className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-none" variant="outline">
                                                            <Plus className="mr-2 h-4 w-4" /> Agregar Horario
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {schedules.map((s, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm animate-in slide-in-from-right-2 duration-300">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-sm bg-muted px-2 py-1 rounded text-primary">{getDayLabel(s.dayOfWeek)}</span>
                                                                    <span className="text-muted-foreground text-sm font-medium">{s.startTime} - {s.endTime}</span>
                                                                </div>
                                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSchedule(idx)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        {schedules.length === 0 && (
                                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-2xl opacity-50">
                                                                No hay horarios definidos
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter className="pt-6 border-t mt-4">
                                                <Button type="submit" className="px-8 font-bold text-lg h-12 rounded-xl shadow-lg shadow-primary/20">
                                                    {isCloning ? "Clonar Curso" : (editCourse ? "Actualizar" : "Guardar Curso")}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                    </div>
                </div>

                <TabsContent value="courses" className="animate-in fade-in duration-500 mt-0">
                    <CourseManager 
                        initialCourses={courses} 
                        pendingEnrollments={pendingEnrollments} 
                        currentDate={currentDate} 
                        filter={courseFilter as any}
                        onEdit={openEditDialog}
                        onClone={openCloneDialog}
                    />
                </TabsContent>

                <TabsContent value="enrollments" className="animate-in fade-in duration-500 mt-0">
                    <EnrollmentRequests requests={pendingEnrollments} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
