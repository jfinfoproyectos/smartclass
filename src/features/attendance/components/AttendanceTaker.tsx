"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, UserCheck, Calendar } from "lucide-react";
import { getCourseStudentsAction, recordAttendanceAction, getStudentAttendanceStatsAction } from "@/app/actions";
import { toast } from "sonner";
import { formatCalendarDate } from "@/lib/dateUtils";

interface AttendanceTakerProps {
    courseId: string;
}

interface Student {
    id: string;
    name: string;
    email: string;
    image: string | null;
    profile: {
        identificacion: string;
        nombres: string;
        apellido: string;
    } | null;
}

export function AttendanceTaker({ courseId }: AttendanceTakerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [studentStats, setStudentStats] = useState<{ late: number; excused: number; absences: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadStudents();
        }
    }, [isOpen]);

    useEffect(() => {
        if (students.length > 0 && students[currentIndex]) {
            loadStudentStats(students[currentIndex].id);
        }
    }, [currentIndex, students, isOpen]);

    const loadStudentStats = async (studentId: string) => {
        try {
            const stats = await getStudentAttendanceStatsAction(courseId, studentId);
            setStudentStats({
                late: stats.late,
                excused: stats.excused,
                absences: stats.absences
            });
        } catch (error) {
            console.error("Error loading stats", error);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await getCourseStudentsAction(courseId);
            // Extract user from enrollment
            const studentList = data.map((enrollment: any) => enrollment.user);
            // Sort by last name
            studentList.sort((a: Student, b: Student) => {
                const nameA = a.profile?.apellido || a.name;
                const nameB = b.profile?.apellido || b.name;
                return nameA.localeCompare(nameB);
            });
            setStudents(studentList);
        } catch (error) {
            toast.error("Error al cargar estudiantes");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = useCallback(() => {
        if (currentIndex < students.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    }, [currentIndex, students.length]);

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleMarkAttendance = async (status: "PRESENT" | "ABSENT" | "EXCUSED") => {
        const student = students[currentIndex];
        if (!student) return;

        try {
            // Format date as YYYY-MM-DD using local time (date-fns format uses local by default)
            const dateStr = format(attendanceDate, "yyyy-MM-dd");
            await recordAttendanceAction(courseId, student.id, dateStr, status);
            toast.success(`Marcado como ${status === "PRESENT" ? "Presente" : status === "ABSENT" ? "Ausente" : "Excusado"}`);

            // Auto advance if not the last student
            if (currentIndex < students.length - 1) {
                handleNext();
            } else {
                toast.success("Asistencia completada");
                setIsOpen(false);
            }
        } catch (error) {
            toast.error("Error al registrar asistencia");
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "ArrowRight":
                    handleNext();
                    break;
                case "ArrowLeft":
                    handlePrevious();
                    break;
                case "p":
                case "P":
                    handleMarkAttendance("PRESENT");
                    break;
                case "a":
                case "A":
                    handleMarkAttendance("ABSENT");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleNext, handlePrevious, students, currentIndex]);

    const currentStudent = students[currentIndex];

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Llamar Asistencia
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-screen p-0 flex flex-col gap-0 border-none">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-4">
                        <SheetTitle className="text-xl font-bold">Llamado de Asistencia</SheetTitle>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatCalendarDate(attendanceDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background overflow-y-auto">
                    {loading ? (
                        <div>Cargando estudiantes...</div>
                    ) : currentStudent ? (
                        <div className="flex flex-col items-center gap-4 max-w-5xl w-full animate-in fade-in zoom-in duration-300">

                            <div className="text-2xl font-bold text-primary">
                                {currentIndex + 1} / {students.length}
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full">
                                {/* Avatar and Name */}
                                <div className="flex flex-col items-center gap-3">
                                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary shadow-xl">
                                        <AvatarImage src={currentStudent.image || ""} alt={currentStudent.name} />
                                        <AvatarFallback className="text-2xl md:text-3xl">
                                            {currentStudent.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="text-center">
                                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                            {currentStudent.profile?.nombres || currentStudent.name.split(" ")[0]}
                                        </h1>
                                        <h2 className="text-xl md:text-2xl text-muted-foreground font-light">
                                            {currentStudent.profile?.apellido || currentStudent.name.split(" ").slice(1).join(" ")}
                                        </h2>
                                    </div>
                                </div>

                                {/* Stats */}
                                {studentStats && (
                                    <div className="w-full md:flex-1 grid grid-cols-3 gap-2 md:gap-4">
                                        <div className="flex flex-col items-center p-2 md:p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
                                            <span className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                                {studentStats.late}
                                            </span>
                                            <span className="text-[10px] md:text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider mt-1 text-center leading-tight">
                                                Llegadas Tarde
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center p-2 md:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
                                            <span className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                {studentStats.excused}
                                            </span>
                                            <span className="text-[10px] md:text-xs font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider mt-1 text-center leading-tight">
                                                Inasistencias Justif.
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center p-2 md:p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                                            <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                                                {studentStats.absences}
                                            </span>
                                            <span className="text-[10px] md:text-xs font-medium text-red-800 dark:text-red-300 uppercase tracking-wider mt-1 text-center leading-tight">
                                                Inasistencias Sin Sop.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-6 w-full justify-center">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-16 md:h-20 w-32 md:w-40 text-lg md:text-xl border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/30"
                                    onClick={() => handleMarkAttendance("ABSENT")}
                                >
                                    <X className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                                    Ausente
                                </Button>

                                <Button
                                    size="lg"
                                    className="h-16 md:h-20 w-32 md:w-40 text-lg md:text-xl bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/20 transition-all"
                                    onClick={() => handleMarkAttendance("PRESENT")}
                                >
                                    <Check className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                                    Presente
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            No hay estudiantes en este curso.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
