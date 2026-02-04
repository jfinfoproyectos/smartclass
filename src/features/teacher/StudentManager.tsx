"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Plus, Search, UserPlus, Trash2, UserCheck, Eye, Calendar, MoreHorizontal, ShieldAlert, ShieldCheck, FileSpreadsheet, ClipboardX } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addStudentToCourseAction, searchStudentsAction, removeStudentFromCourseAction, getStudentCourseEnrollmentAction, recordAttendanceAction, updateStudentStatusAction, getStudentMissingActivitiesAction } from "@/app/actions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StudentActivityDetails } from "./components/StudentActivityDetails";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudentManager({ courseId, initialStudents }: { courseId: string, initialStudents: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [viewingEnrollment, setViewingEnrollment] = useState<any | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingAttendance, setIsExportingAttendance] = useState(false);

    // Absence Dialog State
    const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
    const [studentForAbsence, setStudentForAbsence] = useState<any | null>(null);
    const [absenceDate, setAbsenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceStatus, setAttendanceStatus] = useState<"PRESENT" | "ABSENT">("ABSENT");

    const handleExportReport = async () => {
        setIsExporting(true);
        try {
            const { getCourseGradesReportAction } = await import("@/app/actions");
            const { exportToExcel } = await import("@/lib/export-utils");

            const data = await getCourseGradesReportAction(courseId);
            exportToExcel(data, `Reporte_Notas_${new Date().toISOString().split('T')[0]}`, "Notas");
            toast.success("Reporte generado exitosamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportAttendanceReport = async () => {
        setIsExportingAttendance(true);
        try {
            const { getCourseAttendanceReportAction } = await import("@/app/actions");
            const { exportToExcel } = await import("@/lib/export-utils");

            const data = await getCourseAttendanceReportAction(courseId);
            exportToExcel(data, `Reporte_Asistencias_${new Date().toISOString().split('T')[0]}`, "Asistencias");
            toast.success("Reporte generado exitosamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte");
        } finally {
            setIsExportingAttendance(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchStudentsAction(query);
            // Filter out already enrolled students
            const filtered = results.filter(r => !initialStudents.some(s => s.user.id === r.id));
            setSearchResults(filtered);
        } catch (error) {
            console.error("Error searching students:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewActivities = async (studentId: string) => {
        setIsLoadingDetails(true);
        try {
            const enrollment = await getStudentCourseEnrollmentAction(studentId, courseId);
            setViewingEnrollment(enrollment);
            setIsDetailsOpen(true);
        } catch (error) {
            console.error("Error fetching student details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleOpenAbsenceDialog = (student: any) => {
        setStudentForAbsence(student);
        setAbsenceDate(new Date().toISOString().split('T')[0]);
        setAttendanceStatus("ABSENT");
        setIsAbsenceDialogOpen(true);
    };

    const handleRecordAbsence = async () => {
        if (!studentForAbsence || !absenceDate) return;

        try {
            // Create date from string input (YYYY-MM-DD) and set to noon to avoid timezone issues
            const dateParts = absenceDate.split('-');
            const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);

            await recordAttendanceAction(courseId, studentForAbsence.id, date, attendanceStatus);
            toast.success(`Asistencia registrada para ${studentForAbsence.name}`);
            setIsAbsenceDialogOpen(false);
            setStudentForAbsence(null);
        } catch (error) {
            toast.error("Error al registrar inasistencia");
        }
    };

    const handleStatusChange = async (enrollmentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            await updateStudentStatusAction(enrollmentId, newStatus);
            toast.success(`Estado actualizado a ${newStatus === 'APPROVED' ? 'Activo' : 'Suspendido'}`);
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    const filteredStudents = initialStudents.filter(enrollment =>
        enrollment.user.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        enrollment.user.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
        enrollment.user.profile?.identificacion?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        enrollment.user.profile?.nombres?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        enrollment.user.profile?.apellido?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        enrollment.user.profile?.telefono?.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
            case 'PENDING':
                return <Badge variant="outline" className="text-orange-500 border-orange-500">Pendiente</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Suspendido</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="relative flex-1 max-w-full sm:max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrar estudiantes..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportReport}
                        disabled={isExporting}
                        className="w-full sm:w-auto"
                    >
                        {isExporting ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                Reporte de Calificaciones
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportAttendanceReport}
                        disabled={isExportingAttendance}
                        className="w-full sm:w-auto"
                    >
                        {isExportingAttendance ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <Calendar className="mr-2 h-4 w-4" />
                                Reporte de Inasistencias
                            </>
                        )}
                    </Button>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" /> Agregar Estudiante</Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-screen max-w-none sm:max-w-none p-0">
                            <SheetHeader className="px-6 py-4 border-b">
                                <SheetTitle>Agregar Estudiante al Curso</SheetTitle>
                                <SheetDescription>
                                    Busca estudiantes por nombre, apellido, identificación o correo electrónico
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Search Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="search">Buscar Estudiante</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Escribe nombre, apellido, identificación o correo..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Escribe al menos 2 caracteres para buscar
                                    </p>
                                </div>

                                {/* Search Results Table */}
                                {searchQuery.length >= 2 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                Resultados de Búsqueda
                                                {searchResults.length > 0 && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        {searchResults.length}
                                                    </Badge>
                                                )}
                                            </h3>
                                            {isSearching && (
                                                <span className="text-xs text-muted-foreground">Buscando...</span>
                                            )}
                                        </div>

                                        {searchResults.length > 0 ? (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[50px]"></TableHead>
                                                            <TableHead>Nombre Completo</TableHead>
                                                            <TableHead>Identificación</TableHead>
                                                            <TableHead>Habeas Data</TableHead>
                                                            <TableHead>Correo</TableHead>
                                                            <TableHead>Teléfono</TableHead>
                                                            <TableHead className="text-right">Acción</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {searchResults.map((student) => (
                                                            <TableRow
                                                                key={student.id}
                                                                className={selectedStudent?.id === student.id ? "bg-accent" : ""}
                                                            >
                                                                <TableCell>
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={student.image} />
                                                                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                                                                    </Avatar>
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    {student.profile?.nombres && student.profile?.apellido
                                                                        ? `${student.profile.nombres} ${student.profile.apellido}`
                                                                        : student.name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {student.profile?.identificacion || "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {student.profile?.dataProcessingConsent ? (
                                                                        <Badge className="bg-green-500 hover:bg-green-600">Aceptado</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-orange-500 border-orange-500">Pendiente</Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="truncate max-w-[200px]">{student.email}</TableCell>
                                                                <TableCell>
                                                                    {student.profile?.telefono || "-"}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant={selectedStudent?.id === student.id ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => setSelectedStudent(student)}
                                                                    >
                                                                        {selectedStudent?.id === student.id ? (
                                                                            <>
                                                                                <UserCheck className="h-4 w-4 mr-2" />
                                                                                Seleccionado
                                                                            </>
                                                                        ) : (
                                                                            "Seleccionar"
                                                                        )}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : !isSearching ? (
                                            <div className="rounded-md border border-dashed p-8 text-center">
                                                <p className="text-sm text-muted-foreground">
                                                    No se encontraron estudiantes que coincidan con tu búsqueda
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Selected Student Card */}
                                {selectedStudent && (
                                    <div className="rounded-lg border p-4 bg-muted/50">
                                        <h4 className="text-sm font-semibold mb-3">Estudiante Seleccionado</h4>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={selectedStudent.image} />
                                                <AvatarFallback>{selectedStudent.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {selectedStudent.profile?.nombres && selectedStudent.profile?.apellido
                                                        ? `${selectedStudent.profile.nombres} ${selectedStudent.profile.apellido}`
                                                        : selectedStudent.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                                                {selectedStudent.profile?.identificacion && (
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {selectedStudent.profile.identificacion}
                                                    </p>
                                                )}
                                                <div className="mt-1">
                                                    {selectedStudent.profile?.dataProcessingConsent ? (
                                                        <Badge className="bg-green-500 hover:bg-green-600 text-[10px] h-5">Habeas Data: Aceptado</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-orange-500 border-orange-500 text-[10px] h-5">Habeas Data: Pendiente</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <SheetFooter className="px-6 py-4 border-t bg-muted/50">
                                <form
                                    action={async (formData) => {
                                        if (!selectedStudent) return;
                                        formData.append("userId", selectedStudent.id);
                                        formData.append("courseId", courseId);
                                        await addStudentToCourseAction(formData);
                                        setIsOpen(false);
                                        setSelectedStudent(null);
                                        setSearchQuery("");
                                        setSearchResults([]);
                                    }}
                                    className="w-full"
                                >
                                    <Button
                                        type="submit"
                                        disabled={!selectedStudent}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Agregar al Curso
                                    </Button>
                                </form>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    {/* Sheet for Viewing Student Activities */}
                    <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <SheetContent side="right" className="w-screen max-w-none sm:max-w-none p-0">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Detalles del Estudiante</SheetTitle>
                                <SheetDescription>
                                    Vista detallada de las actividades, calificaciones y asistencia del estudiante seleccionado.
                                </SheetDescription>
                            </SheetHeader>
                            {viewingEnrollment ? (
                                <StudentActivityDetails
                                    enrollment={viewingEnrollment}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p className="text-muted-foreground">Cargando detalles...</p>
                                    </div>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Absence Dialog */}
            <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Asistencia</DialogTitle>
                        <DialogDescription>
                            Registra el estado de asistencia de <strong>{studentForAbsence?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="absence-date">Fecha</Label>
                            <Input
                                id="absence-date"
                                type="date"
                                value={absenceDate}
                                onChange={(e) => setAbsenceDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <RadioGroup value={attendanceStatus} onValueChange={(val: any) => setAttendanceStatus(val)} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ABSENT" id="st-absent" />
                                    <Label htmlFor="st-absent" className="font-normal cursor-pointer">Ausente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PRESENT" id="st-present" />
                                    <Label htmlFor="st-present" className="font-normal cursor-pointer">Presente</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAbsenceDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRecordAbsence}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="w-full overflow-x-auto rounded-md border">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map((enrollment) => (
                            <TableRow key={enrollment.user.id}>
                                <TableCell>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={enrollment.user.image} />
                                        <AvatarFallback>{enrollment.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {enrollment.user.profile?.nombres && enrollment.user.profile?.apellido
                                        ? `${enrollment.user.profile.nombres} ${enrollment.user.profile.apellido}`
                                        : enrollment.user.name}
                                </TableCell>
                                <TableCell>{enrollment.user.profile?.identificacion || "-"}</TableCell>
                                <TableCell className="truncate max-w-[200px]">{enrollment.user.email}</TableCell>
                                <TableCell>{enrollment.user.profile?.telefono || "-"}</TableCell>
                                <TableCell>
                                    {getStatusBadge(enrollment.status || 'APPROVED')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <TooltipProvider>
                                        <div className="flex justify-end gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenAbsenceDialog(enrollment.user)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <Calendar className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Registrar Asistencia</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewActivities(enrollment.user.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Ver Detalles</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <MissingActivitiesDialog
                                                courseId={courseId}
                                                userId={enrollment.user.id}
                                                studentName={enrollment.user.name}
                                            />

                                            <DropdownMenu>

                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {enrollment.status === 'REJECTED' ? (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, 'APPROVED')}>
                                                            <ShieldCheck className="mr-2 h-4 w-4" /> Activar
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, 'REJECTED')}>
                                                            <ShieldAlert className="mr-2 h-4 w-4" /> Suspender
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Eliminar Estudiante</DialogTitle>
                                                                <DialogDescription>
                                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente a <strong>{enrollment.user.name}</strong> del curso y todos sus registros de asistencia y calificaciones.
                                                                    <br /><br />
                                                                    Escribe <strong>eliminar</strong> para confirmar.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="py-2">
                                                                <Input
                                                                    placeholder="Escribe eliminar"
                                                                    onChange={(e) => {
                                                                        const btn = document.getElementById(`delete-btn-${enrollment.user.id}`) as HTMLButtonElement;
                                                                        if (btn) btn.disabled = e.target.value !== "eliminar";
                                                                    }}
                                                                />
                                                            </div>
                                                            <DialogFooter>
                                                                <form action={async () => {
                                                                    const formData = new FormData();
                                                                    formData.append("userId", enrollment.user.id);
                                                                    formData.append("courseId", courseId);
                                                                    await removeStudentFromCourseAction(formData);
                                                                }}>
                                                                    <Button
                                                                        id={`delete-btn-${enrollment.user.id}`}
                                                                        type="submit"
                                                                        variant="destructive"
                                                                        disabled
                                                                    >
                                                                        Eliminar
                                                                    </Button>
                                                                </form>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TooltipProvider>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No hay estudiantes inscritos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}

function MissingActivitiesDialog({ courseId, userId, studentName }: { courseId: string, userId: string, studentName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getStudentMissingActivitiesAction(courseId, userId)
                .then(setActivities)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, courseId, userId]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <ClipboardX className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver actividades faltantes</p>
                    </TooltipContent>
                </Tooltip>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Actividades Pendientes</DialogTitle>
                    <DialogDescription>
                        Actividades que <strong>{studentName}</strong> aún no ha entregado.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[300px] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <div key={activity.id} className="p-3 border rounded-md hover:bg-muted/50">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-sm">{activity.title}</p>
                                        <Badge variant="outline" className="text-[10px]">{activity.type}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Vence: {new Date(activity.deadline).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>¡Este estudiante está al día con todas las entregas!</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
