"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCatalog } from "./CourseCatalog";
import { MyEnrollments } from "./MyEnrollments";

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

    const handleSelectCourse = (courseId: string | null) => {
        setSelectedCourse(courseId || "");
    };

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
                </div>

                <TabsContent value="my-courses" className="space-y-6 mt-0">
                    <MyEnrollments
                        enrollments={myEnrollments}
                        selectedCourse={selectedCourse}
                        onSelectCourse={handleSelectCourse}
                    />
                </TabsContent>
                <TabsContent value="catalog" className="space-y-6 mt-0">
                    <CourseCatalog
                        courses={availableCourses.filter(course =>
                            !myEnrollments.some(enrollment => enrollment.courseId === course.id) &&
                            (!course.endDate || new Date(course.endDate) >= new Date()) &&
                            course.registrationOpen &&
                            (!course.registrationDeadline || new Date(course.registrationDeadline) >= new Date())
                        )}
                        pendingEnrollments={pendingEnrollments}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
