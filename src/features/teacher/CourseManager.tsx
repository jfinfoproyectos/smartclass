"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createCourseAction, deleteCourseAction, updateRegistrationSettingsAction, cloneCourseAction } from "@/app/actions";
import { Plus, Trash2, Eye, Lock, Unlock, Calendar, Settings, X, Copy, FileWarning } from "lucide-react";

import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateCourseAction } from "@/app/actions";
import { Pencil } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Helper function to format date consistently on server and client
function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function RegistrationSettingsDialog({ course }: { course: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"permanent" | "date">(course.registrationDeadline ? "date" : "permanent");
    const [deadline, setDeadline] = useState(course.registrationDeadline ? new Date(course.registrationDeadline).toISOString().slice(0, 16) : "");

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={course.registrationOpen ? "text-green-600 hover:text-green-700 h-auto py-1" : "text-red-600 hover:text-red-700 h-auto py-1"}
                >
                    {course.registrationOpen ? (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center">
                                <Unlock className="h-4 w-4 mr-1" />
                                {course.registrationDeadline ? "Hasta fecha" : "Abierta"}
                            </div>
                            {course.registrationDeadline && (
                                <span className="text-[10px] opacity-80">
                                    {formatDateTime(course.registrationDeadline)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <Lock className="h-4 w-4 mr-1" />
                            Cerrada
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configurar Inscripción</DialogTitle>
                    <DialogDescription>
                        Gestiona la disponibilidad del curso para nuevos estudiantes.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    await updateRegistrationSettingsAction(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="courseId" value={course.id} />

                    <div className="space-y-2">
                        <Label>Estado de Inscripción</Label>
                        <RadioGroup name="isOpen" defaultValue={course.registrationOpen ? "true" : "false"}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="open" />
                                <Label htmlFor="open">Abierta</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="closed" />
                                <Label htmlFor="closed">Cerrada</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Duración</Label>
                        <RadioGroup value={mode} onValueChange={(v: "permanent" | "date") => setMode(v)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="permanent" id="permanent" />
                                <Label htmlFor="permanent">Permanente</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="date" id="date" />
                                <Label htmlFor="date">Hasta fecha específica</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {mode === "date" && (
                        <div className="space-y-2">
                            <Label htmlFor="deadline">Fecha límite</Label>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required={mode === "date"}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}




function DeleteCourseDialog({ courseId, courseTitle }: { courseId: string, courseTitle: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Eliminar"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar Curso</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el curso <strong>{courseTitle}</strong> y todos sus datos asociados.
                    </DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    await deleteCourseAction(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="courseId" value={courseId} />
                    <div className="space-y-2">
                        <Label htmlFor="confirmText">
                            Escribe <strong>ELIMINAR</strong> para confirmar
                        </Label>
                        <Input
                            id="confirmText"
                            name="confirmText"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            required
                            pattern="ELIMINAR"
                            placeholder="ELIMINAR"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={confirmText !== "ELIMINAR"}
                        >
                            Eliminar Curso
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import { EnrollmentRequests } from "./EnrollmentRequests";
import { Badge } from "@/components/ui/badge";

export function CourseManager({ initialCourses, pendingEnrollments = [] }: { initialCourses: any[], pendingEnrollments?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<any>(null);
    const [isCloning, setIsCloning] = useState(false);

    // Schedule state
    const [schedules, setSchedules] = useState<Array<{
        dayOfWeek: string;
        startTime: string;
        endTime: string;
    }>>([]);
    const [newDayOfWeek, setNewDayOfWeek] = useState("");
    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");

    const activeCourses = initialCourses.filter(course => !course.endDate || new Date(course.endDate) >= new Date());
    const archivedCourses = initialCourses.filter(course => course.endDate && new Date(course.endDate) < new Date());

    // Schedule helper functions
    const addSchedule = () => {
        if (newDayOfWeek && newStartTime && newEndTime) {
            setSchedules([...schedules, {
                dayOfWeek: newDayOfWeek,
                startTime: newStartTime,
                endTime: newEndTime
            }]);
            setNewDayOfWeek("");
            setNewStartTime("");
            setNewEndTime("");
        }
    };

    const removeSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    const getDayLabel = (day: string) => {
        const labels: Record<string, string> = {
            MONDAY: "Lunes",
            TUESDAY: "Martes",
            WEDNESDAY: "Miércoles",
            THURSDAY: "Jueves",
            FRIDAY: "Viernes",
            SATURDAY: "Sábado",
            SUNDAY: "Domingo"
        };
        return labels[day] || day;
    };

    const CourseTable = ({ courses }: { courses: any[] }) => (
        <div className="w-full overflow-x-auto rounded-md border">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                        <TableHead className="hidden sm:table-cell">Fechas</TableHead>
                        <TableHead>Estudiantes</TableHead>
                        <TableHead className="hidden lg:table-cell">Inscripción</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-md truncate" title={course.description}>
                                {course.description || "Sin descripción"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                                <div className="flex flex-col gap-1">
                                    {course.startDate && (
                                        <span className="text-muted-foreground">
                                            Inicio: {new Date(course.startDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {course.endDate && (
                                        <span className={new Date(course.endDate) < new Date() ? "text-destructive" : "text-muted-foreground"}>
                                            Fin: {new Date(course.endDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {!course.startDate && !course.endDate && (
                                        <span className="text-muted-foreground italic">Sin fechas</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{course._count.enrollments}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <RegistrationSettingsDialog course={course} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1 flex-wrap">
                                    <Link href={`/dashboard/teacher/courses/${course.id}`}>
                                        <Button variant="ghost" size="icon" title="Ver Detalles">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Editar"
                                        onClick={() => {
                                            setEditCourse(course);
                                            // Load course schedules if available
                                            setSchedules(course.schedules || []);
                                            setIsOpen(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Clonar Curso"
                                        onClick={() => {
                                            setEditCourse({
                                                ...course,
                                                title: `Copia de ${course.title}`,
                                                id: course.id // Keep ID for reference but flag as cloning
                                            });
                                            setIsCloning(true);
                                            setSchedules(course.schedules || []);
                                            setIsOpen(true);
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Link href={`/dashboard/teacher/courses/${course.id}/duplicates`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Reporte de Duplicados"
                                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                        >
                                            <FileWarning className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <DeleteCourseDialog courseId={course.id} courseTitle={course.title} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {courses.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No hay cursos en esta sección.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Gestión de Cursos</h3>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditCourse(null);
                        setIsCloning(false);
                        setSchedules([]);
                        setNewDayOfWeek("");
                        setNewStartTime("");
                        setNewEndTime("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Crear Curso</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] sm:max-w-7xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                        <form action={async (formData) => {
                            // Add schedules to formData
                            formData.append("schedules", JSON.stringify(schedules));

                            if (isCloning) {
                                formData.append("sourceCourseId", editCourse.id);
                                await cloneCourseAction(formData);
                            } else if (editCourse) {
                                await updateCourseAction(formData);
                            } else {
                                await createCourseAction(formData);
                            }
                            setIsOpen(false);
                            setEditCourse(null);
                            setIsCloning(false);
                            setSchedules([]);
                        }}>
                            {editCourse && !isCloning && <input type="hidden" name="courseId" value={editCourse.id} />}
                            <DialogHeader>
                                <DialogTitle>
                                    {isCloning ? "Clonar Curso" : (editCourse ? "Editar Curso" : "Crear Nuevo Curso")}
                                </DialogTitle>
                                <DialogDescription>
                                    {isCloning
                                        ? "Configura los detalles del nuevo curso basado en el original."
                                        : (editCourse ? "Modifica los detalles del curso." : "Ingresa los detalles del nuevo curso.")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">
                                                Título *
                                            </Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                required
                                                defaultValue={editCourse?.title}
                                                placeholder="Nombre del curso"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">
                                                Descripción
                                            </Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                defaultValue={editCourse?.description}
                                                placeholder="Descripción del curso"
                                                rows={5}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="externalUrl">
                                                Enlace Externo (Opcional)
                                            </Label>
                                            <Input
                                                id="externalUrl"
                                                name="externalUrl"
                                                type="url"
                                                defaultValue={editCourse?.externalUrl}
                                                placeholder="https://classroom.google.com/..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                URL a recursos externos del curso (ej: Google Classroom, Moodle, etc.)
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate">
                                                    Fecha Inicio
                                                </Label>
                                                <Input
                                                    id="startDate"
                                                    name="startDate"
                                                    type="date"
                                                    defaultValue={editCourse?.startDate ? new Date(editCourse.startDate).toISOString().split('T')[0] : ''}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">
                                                    Fecha Fin
                                                </Label>
                                                <Input
                                                    id="endDate"
                                                    name="endDate"
                                                    type="date"
                                                    defaultValue={editCourse?.endDate ? new Date(editCourse.endDate).toISOString().split('T')[0] : ''}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Schedule Section */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Horario del Curso</Label>

                                        {/* List of added schedules */}
                                        {schedules.length > 0 && (
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                {schedules.map((schedule, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium">{getDayLabel(schedule.dayOfWeek)}</span>
                                                            <span className="text-muted-foreground">
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeSchedule(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add new schedule form */}
                                        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                                            <div className="space-y-2">
                                                <Label>Día de la semana</Label>
                                                <Select value={newDayOfWeek} onValueChange={setNewDayOfWeek}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar día" />
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

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Hora Inicio</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={newStartTime.split(':')[0] || ''}
                                                            onValueChange={(hour) => {
                                                                const minute = newStartTime.split(':')[1] || '00';
                                                                setNewStartTime(`${hour}:${minute}`);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="HH" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 24 }, (_, i) => {
                                                                    const hour = i.toString().padStart(2, '0');
                                                                    return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                        <span className="text-muted-foreground">:</span>
                                                        <Select
                                                            value={newStartTime.split(':')[1] || ''}
                                                            onValueChange={(minute) => {
                                                                const hour = newStartTime.split(':')[0] || '00';
                                                                setNewStartTime(`${hour}:${minute}`);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="MM" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="00">00</SelectItem>
                                                                <SelectItem value="15">15</SelectItem>
                                                                <SelectItem value="30">30</SelectItem>
                                                                <SelectItem value="45">45</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Hora Fin</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={newEndTime.split(':')[0] || ''}
                                                            onValueChange={(hour) => {
                                                                const minute = newEndTime.split(':')[1] || '00';
                                                                setNewEndTime(`${hour}:${minute}`);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="HH" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 24 }, (_, i) => {
                                                                    const hour = i.toString().padStart(2, '0');
                                                                    return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                        <span className="text-muted-foreground">:</span>
                                                        <Select
                                                            value={newEndTime.split(':')[1] || ''}
                                                            onValueChange={(minute) => {
                                                                const hour = newEndTime.split(':')[0] || '00';
                                                                setNewEndTime(`${hour}:${minute}`);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="MM" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="00">00</SelectItem>
                                                                <SelectItem value="15">15</SelectItem>
                                                                <SelectItem value="30">30</SelectItem>
                                                                <SelectItem value="45">45</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={addSchedule}
                                                disabled={!newDayOfWeek || !newStartTime || !newEndTime}
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar Horario
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">
                                    {isCloning ? "Clonar Curso" : (editCourse ? "Actualizar" : "Guardar")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:inline-flex">
                    <TabsTrigger value="active" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">Cursos Activos ({activeCourses.length})</span>
                        <span className="sm:hidden">Activos ({activeCourses.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">Cursos Archivados ({archivedCourses.length})</span>
                        <span className="sm:hidden">Archivados ({archivedCourses.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="relative text-xs sm:text-sm">
                        <span className="hidden sm:inline">Solicitudes</span>
                        <span className="sm:hidden">Solicitudes</span>
                        {pendingEnrollments.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-[10px]">
                                {pendingEnrollments.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-4">
                    <CourseTable courses={activeCourses} />
                </TabsContent>
                <TabsContent value="archived" className="mt-4">
                    <CourseTable courses={archivedCourses} />
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                    <EnrollmentRequests requests={pendingEnrollments} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
