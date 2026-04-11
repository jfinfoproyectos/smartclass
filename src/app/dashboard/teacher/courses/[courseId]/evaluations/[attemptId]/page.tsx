import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { evaluationService } from "@/services/evaluationService";
import { courseService } from "@/services/courseService";
import { EvaluationStats } from "@/features/teacher/EvaluationStats";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EvaluationAttemptResultsPage({ 
    params 
}: { 
    params: Promise<{ courseId: string; attemptId: string }> 
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "teacher") {
        redirect("/signin");
    }

    const { courseId, attemptId } = await params;

    const [course, attempt, submissions] = await Promise.all([
        courseService.getCourseById(courseId),
        evaluationService.getAttemptWithQuestions(attemptId),
        evaluationService.getSubmissionsByAttempt(attemptId)
    ]);

    if (!course || !attempt) {
        notFound();
    }

    // Verify ownership
    if (course.teacherId !== session.user.id) {
        redirect("/dashboard/teacher");
    }

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Button variant="ghost" size="sm" asChild className="w-fit h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors group">
                <Link href={`/dashboard/teacher/courses/${courseId}?tab=evaluations`} className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest">
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Volver a Evaluaciones
                </Link>
            </Button>

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Resultados: {attempt.evaluation.title}
                </h1>
                <p className="text-muted-foreground">
                    Análisis detallado del desempeño del grupo en esta evaluación.
                </p>
            </div>

            <EvaluationStats 
                submissions={submissions}
                totalQuestions={attempt.evaluation.questions.length}
                questions={attempt.evaluation.questions}
                evaluationId={attempt.evaluationId}
                attemptId={attemptId}
                courseName={course.title}
                teacherName={session.user.name || "Profesor"}
            />
        </div>
    );
}
