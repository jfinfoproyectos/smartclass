import { gradeSubmission } from "./gemini/gradingService";
import prisma from "@/lib/prisma";



export const activityService = {
    async createActivity(data: { title: string; description?: string; statement?: string; filePaths?: string; deadline: Date; openDate?: Date; courseId: string; type?: "GITHUB" | "MANUAL" | "GOOGLE_COLAB" | "PDF_REVIEW" | "CODE_PROJECT"; weight?: number; maxAttempts?: number; allowLinkSubmission?: boolean }) {
        // Get max order for the course
        const maxOrderActivity = await prisma.activity.findFirst({
            where: { courseId: data.courseId },
            orderBy: { order: 'desc' },
        });
        const newOrder = (maxOrderActivity?.order ?? -1) + 1;

        return await prisma.activity.create({
            data: {
                ...data,
                type: data.type || "GITHUB",
                weight: data.weight || 1.0,
                maxAttempts: data.maxAttempts || 1,
                order: newOrder,
            },
        });
    },

    async updateActivity(id: string, data: { title?: string; description?: string; statement?: string; filePaths?: string; deadline?: Date; openDate?: Date; type?: "GITHUB" | "MANUAL" | "GOOGLE_COLAB" | "PDF_REVIEW" | "CODE_PROJECT"; weight?: number; maxAttempts?: number; allowLinkSubmission?: boolean }) {
        return await prisma.activity.update({
            where: { id },
            data,
        });
    },

    async deleteActivity(id: string) {
        return await prisma.activity.delete({
            where: { id },
        });
    },

    async reorderActivities(courseId: string, activityIds: string[]) {
        const transaction = activityIds.map((id, index) =>
            prisma.activity.update({
                where: { id, courseId }, // Ensure activity belongs to course
                data: { order: index },
            })
        );
        return await prisma.$transaction(transaction);
    },

    async updateAllActivityWeights(courseId: string, newWeight: number) {
        return await prisma.activity.updateMany({
            where: { courseId },
            data: { weight: newWeight },
        });
    },

    async getCourseActivities(courseId: string, userId?: string) {
        return await prisma.activity.findMany({
            where: { courseId },
            orderBy: { order: "asc" }, // Order by 'order' field
            include: {
                submissions: userId ? {
                    where: { userId },
                } : true,
            },
        });
    },

    async getActivityWithSubmissions(activityId: string) {
        return await prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                submissions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            }
                        }
                    }
                },
                course: {
                    select: {
                        title: true,
                        teacherId: true
                    }
                }
            },
        });
    },

    async submitActivity(data: { url: string; activityId: string; userId: string; grade?: number | null; feedback?: string | null }) {
        // 0. Get activity to check type and maxAttempts
        const activity = await prisma.activity.findUnique({
            where: { id: data.activityId },
        });

        if (!activity) throw new Error("Activity not found");

        // Check if submission already exists
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                userId_activityId: {
                    userId: data.userId,
                    activityId: data.activityId
                }
            }
        });

        // Check max attempts (bypass for MANUAL activities)
        const currentAttempts = existingSubmission?.attemptCount || 0;
        if (activity.type !== "MANUAL" && currentAttempts >= activity.maxAttempts) {
            throw new Error(`Maximum submission attempts (${activity.maxAttempts}) reached.`);
        }

        // Validate URL based on type
        if (activity.type === "GITHUB" || activity.type === "CODE_PROJECT") {
            if (!data.url.includes("github.com")) {
                throw new Error("Invalid GitHub URL");
            }
        } else if (activity.type === "GOOGLE_COLAB") {
            if (!data.url.includes("colab.research.google.com") && !data.url.includes("drive.google.com")) {
                throw new Error("Enlace inválido. Debe ser de Google Colab o Google Drive.");
            }
        } else if (activity.type === "PDF_REVIEW") {
            // Accept Google Drive, OneDrive, Dropbox, or any URL ending in .pdf
            const lowerUrl = data.url.toLowerCase();
            const isValidPdfLink =
                lowerUrl.includes("drive.google.com") ||
                lowerUrl.includes("onedrive.live.com") ||
                lowerUrl.includes("1drv.ms") ||
                lowerUrl.includes("dropbox.com") ||
                lowerUrl.endsWith(".pdf") ||
                lowerUrl.includes("/pdf");
            if (!isValidPdfLink) {
                throw new Error("Enlace inválido. Debe ser un enlace a un PDF en Google Drive, OneDrive, Dropbox o una URL directa al archivo PDF.");
            }
        } else if (activity.type === "MANUAL") {
            // Check if link submission is enabled for this manual activity
            // Allow if grade is being set (teacher grading) or if allowLinkSubmission is true
            const isTeacherGrading = data.grade !== undefined;
            if (!isTeacherGrading && !activity.allowLinkSubmission) {
                throw new Error("El profesor no ha habilitado el envío de enlaces para esta actividad");
            }

            // Manual activities accept any URL (Google Drive, OneDrive, etc.)
            // Basic URL validation is handled by the client-side form
            if (!data.url || data.url.trim() === "") {
                throw new Error("Se requiere un enlace para la entrega");
            }
        }

        // Check cooldown period (5 minutes) - except for teacher grading or if submission was rejected
        const isTeacherGrading = data.grade !== undefined || data.feedback !== undefined;
        const isRejected = existingSubmission?.grade === null && existingSubmission?.feedback?.includes("[ENTREGA RECHAZADA]");
        
        if (!isTeacherGrading && !isRejected && existingSubmission && existingSubmission.lastSubmittedAt) {
            const now = new Date().getTime();
            const lastTime = new Date(existingSubmission.lastSubmittedAt).getTime();
            const difference = now - lastTime;
            const cooldownMs = 5 * 60 * 1000;

            if (difference < cooldownMs) {
                const remainingMinutes = Math.ceil((cooldownMs - difference) / (60 * 1000));
                throw new Error(`Debes esperar ${remainingMinutes} minuto(s) antes de realizar una nueva entrega`);
            }
        }

        // 2. Prepare grade and feedback
        // Para actividades GITHUB: si no se provee grade, se deja null
        // (el profesor califica luego desde su panel)
        // Para actividades MANUAL: el professor provee grade via gradeManualActivityAction
        let grade = data.grade !== undefined ? data.grade : null;
        let feedback = data.feedback !== undefined ? data.feedback : null;

        // 3. Upsert submission with grade (if available)
        // For multiple attempts, keep the highest grade AND the feedback from that best attempt
        const existingGrade = existingSubmission?.grade ?? null;
        const bestGradeIsExisting = existingGrade !== null && grade !== null && existingGrade > grade;
        const finalGrade = existingGrade !== null && grade !== null
            ? Math.max(existingGrade, grade)
            : grade;
        // Preserve feedback from the attempt with the highest grade
        const finalFeedback = bestGradeIsExisting ? existingSubmission!.feedback : feedback;

        const submission = await prisma.submission.upsert({
            where: {
                userId_activityId: {
                    userId: data.userId,
                    activityId: data.activityId
                }
            },
            update: {
                url: data.url,
                grade: finalGrade,
                feedback: finalFeedback,
                attemptCount: { increment: 1 },
                lastSubmittedAt: new Date(),
            },
            create: {
                url: data.url,
                activityId: data.activityId,
                userId: data.userId,
                grade: grade,
                feedback: feedback,
                attemptCount: 1,
                lastSubmittedAt: new Date(),
            },
            include: {
                activity: true,
            },
        });

        return submission;
    },

    async getSubmission(activityId: string, userId: string) {
        return await prisma.submission.findUnique({
            where: {
                userId_activityId: {
                    userId,
                    activityId,
                }
            },
        });
    },

    async reevaluateSubmission(submissionId: string) {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { 
                activity: {
                    include: {
                        course: {
                            select: { teacherId: true }
                        }
                    }
                } 
            }
        });

        if (!submission) throw new Error("Submission not found");

        try {
            const gradingResult = await gradeSubmission(
                submission.activity.statement || "",
                submission.url,
                submission.activity.filePaths || undefined,
                (submission.activity as any).course.teacherId
            );

            let newFeedback = gradingResult.feedback;
            if (gradingResult.apiRequestsCount) {
                newFeedback += `\n\n*(Peticiones a la API de Gemini: ${gradingResult.apiRequestsCount})*`;
            }

            return await prisma.submission.update({
                where: { id: submissionId },
                data: {
                    grade: gradingResult.grade,
                    feedback: newFeedback
                }
            });
        } catch (error) {
            console.error("Error re-evaluating submission:", error);
            throw error;
        }
    },

    async deleteSubmission(submissionId: string) {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId }
        });

        if (!submission) throw new Error("Submission not found");

        return await prisma.submission.delete({
            where: { id: submissionId }
        });
    },
};
