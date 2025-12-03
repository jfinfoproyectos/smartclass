import { DuplicateLinksReport } from "@/features/teacher/components/DuplicateLinksReport";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function DuplicateReportPage({ params }: PageProps) {
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
    });

    if (!course) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/teacher">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Reporte de Duplicados</h2>
            </div>

            <div className="mt-6">
                <DuplicateLinksReport courseId={courseId} courseName={course.title} />
            </div>
        </div>
    );
}
