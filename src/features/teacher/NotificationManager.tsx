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
import { createNotificationAction, deleteNotificationAction, updateNotificationAction } from "@/app/actions";
import { Plus, Trash2, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export function NotificationManager({
    initialNotifications,
    courses,
    students
}: {
    initialNotifications: any[],
    courses: any[],
    students: any[]
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [editNotification, setEditNotification] = useState<any>(null);
    const [target, setTarget] = useState<"ALL_COURSES" | "SPECIFIC_COURSE" | "SPECIFIC_STUDENTS">("ALL_COURSES");
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<any>(null);

    const handleStudentToggle = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const getTargetDisplay = (notification: any) => {
        if (notification.target === "ALL_COURSES") {
            return <Badge variant="secondary">Todos los cursos</Badge>;
        } else if (notification.target === "SPECIFIC_COURSE") {
            return <Badge variant="outline">{notification.course?.title || "Curso"}</Badge>;
        } else {
            return <Badge variant="default">{notification.studentIds.length} estudiante(s)</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Gestión de Notificaciones</h3>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditNotification(null);
                        setTarget("ALL_COURSES");
                        setSelectedCourse("");
                        setSelectedStudents([]);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Crear Notificación</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form action={async (formData) => {
                            // Add target-specific data
                            formData.append("target", target);
                            if (target === "SPECIFIC_COURSE") {
                                formData.append("courseId", selectedCourse);
                            } else if (target === "SPECIFIC_STUDENTS") {
                                formData.append("studentIds", JSON.stringify(selectedStudents));
                            }

                            if (editNotification) {
                                formData.append("notificationId", editNotification.id);
                                await updateNotificationAction(formData);
                            } else {
                                await createNotificationAction(formData);
                            }
                            setIsOpen(false);
                            setEditNotification(null);
                            setTarget("ALL_COURSES");
                            setSelectedCourse("");
                            setSelectedStudents([]);
                        }}>
                            <DialogHeader>
                                <DialogTitle>{editNotification ? "Editar Notificación" : "Crear Nueva Notificación"}</DialogTitle>
                                <DialogDescription>
                                    {editNotification ? "Modifica los detalles de la notificación." : "Crea una notificación para tus estudiantes."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        required
                                        defaultValue={editNotification?.title}
                                        placeholder="Título de la notificación"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Mensaje *</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        required
                                        defaultValue={editNotification?.message}
                                        placeholder="Contenido de la notificación"
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Destinatarios *</Label>
                                    <RadioGroup value={target} onValueChange={(v: any) => setTarget(v)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="ALL_COURSES" id="all" />
                                            <Label htmlFor="all">Todos mis cursos</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="SPECIFIC_COURSE" id="course" />
                                            <Label htmlFor="course">Curso específico</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="SPECIFIC_STUDENTS" id="students" />
                                            <Label htmlFor="students">Estudiantes específicos</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {target === "SPECIFIC_COURSE" && (
                                    <div className="space-y-2">
                                        <Label>Seleccionar Curso</Label>
                                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un curso" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {target === "SPECIFIC_STUDENTS" && (
                                    <div className="space-y-2">
                                        <Label>Seleccionar Estudiantes</Label>
                                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                                            {students.map((student) => (
                                                <div key={student.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={student.id}
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={() => handleStudentToggle(student.id)}
                                                    />
                                                    <Label htmlFor={student.id} className="cursor-pointer">
                                                        {student.name} ({student.email})
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedStudents.length} estudiante(s) seleccionado(s)
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editNotification ? "Actualizar" : "Crear"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Mensaje</TableHead>
                            <TableHead>Destinatarios</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialNotifications.map((notification) => (
                            <TableRow key={notification.id}>
                                <TableCell className="font-medium">{notification.title}</TableCell>
                                <TableCell className="max-w-md truncate">{notification.message}</TableCell>
                                <TableCell>{getTargetDisplay(notification)}</TableCell>
                                <TableCell>{new Date(notification.createdAt).toLocaleDateString('es-ES')}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Editar"
                                            onClick={() => {
                                                setEditNotification(notification);
                                                setTarget(notification.target);
                                                setSelectedCourse(notification.courseId || "");
                                                setSelectedStudents(notification.studentIds || []);
                                                setIsOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Eliminar"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setNotificationToDelete(notification);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialNotifications.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay notificaciones creadas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Notificación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={async (formData) => {
                        await deleteNotificationAction(formData);
                        setDeleteDialogOpen(false);
                        setNotificationToDelete(null);
                    }}>
                        <input type="hidden" name="notificationId" value={notificationToDelete?.id} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="destructive">
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
