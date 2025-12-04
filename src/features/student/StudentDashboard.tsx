"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCatalog } from "./CourseCatalog";
import { MyEnrollments } from "./MyEnrollments";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function StudentDashboard({
    availableCourses,
    myEnrollments,
    studentName,
    pendingEnrollments = []
}: {
    availableCourses: any[],
    myEnrollments: any[],
    studentName: string,
    pendingEnrollments?: string[]
}) {
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [openCombobox, setOpenCombobox] = useState(false);

    // Set first course as default
    useEffect(() => {
        if (myEnrollments.length > 0 && !selectedCourse) {
            setSelectedCourse(myEnrollments[0].course.id);
        }
    }, [myEnrollments.length]);

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Estudiante</h1>
                <p className="text-muted-foreground">
                    SmartClass
                </p>
            </div>

            {pendingEnrollments.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
                    Tienes {pendingEnrollments.length} solicitud{pendingEnrollments.length !== 1 ? 'es' : ''} de inscripción pendiente{pendingEnrollments.length !== 1 ? 's' : ''} de aprobación por el profesor.
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="my-courses" className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                        <TabsTrigger value="my-courses">Mis Cursos</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo de Cursos</TabsTrigger>
                    </TabsList>

                    {myEnrollments.length > 0 && (
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full sm:w-[300px] justify-between"
                                >
                                    <span className="truncate">
                                        {selectedCourse
                                            ? myEnrollments.find((e) => e.course.id === selectedCourse)?.course.title
                                            : "Seleccionar curso"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full sm:w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar curso..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró el curso.</CommandEmpty>
                                        <CommandGroup>
                                            {myEnrollments.map((enrollment) => (
                                                <CommandItem
                                                    key={enrollment.course.id}
                                                    value={enrollment.course.id}
                                                    onSelect={(currentValue) => {
                                                        setSelectedCourse(currentValue);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCourse === enrollment.course.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {enrollment.course.title}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <TabsContent value="my-courses" className="space-y-6 mt-0">
                    <MyEnrollments
                        enrollments={myEnrollments}
                        studentName={studentName}
                        selectedCourse={selectedCourse}
                    />
                </TabsContent>
                <TabsContent value="catalog" className="space-y-6 mt-0">
                    <CourseCatalog
                        courses={availableCourses.filter(course =>
                            !myEnrollments.some(enrollment => enrollment.courseId === course.id) &&
                            (!course.endDate || new Date(course.endDate) >= new Date())
                        )}
                        pendingEnrollments={pendingEnrollments}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
