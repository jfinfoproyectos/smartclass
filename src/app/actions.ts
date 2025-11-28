"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { courseService } from "@/services/courseService";
import { activityService } from "@/services/activityService";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function createCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher" && session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const externalUrl = formData.get("externalUrl") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const schedulesStr = formData.get("schedules") as string;

    // Parse schedules if provided
    let schedules;
    if (schedulesStr) {
        try {
            schedules = JSON.parse(schedulesStr);
        } catch (e) {
            console.error("Failed to parse schedules", e);
        }
    }

    const course = await courseService.createCourse({
        title,
        description,
        externalUrl: externalUrl || undefined,
        teacherId: session.user.id,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        schedules,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logCourseCreate(
        course.id,
        title,
        session.user.id,
        session.user.name || "Usuario"
    );

    revalidatePath("/dashboard/teacher");
}

export async function cloneCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher" && session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const sourceCourseId = formData.get("sourceCourseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const externalUrl = formData.get("externalUrl") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const schedulesStr = formData.get("schedules") as string;

    // Parse schedules if provided
    let schedules;
    if (schedulesStr) {
        try {
            schedules = JSON.parse(schedulesStr);
        } catch (e) {
            console.error("Failed to parse schedules", e);
        }
    }

    const course = await courseService.cloneCourse(sourceCourseId, {
        title,
        description,
        externalUrl: externalUrl || undefined,
        teacherId: session.user.id,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        schedules,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logCourseCreate(
        course.id,
        title,
        session.user.id,
        session.user.name || "Usuario"
    );

    revalidatePath("/dashboard/teacher");
}

export async function updateCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const externalUrl = formData.get("externalUrl") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const schedulesStr = formData.get("schedules") as string;

    // Parse schedules if provided
    let schedules;
    if (schedulesStr) {
        try {
            schedules = JSON.parse(schedulesStr);
        } catch (e) {
            console.error("Failed to parse schedules", e);
        }
    }

    await courseService.updateCourse(courseId, {
        title,
        description,
        externalUrl: externalUrl || undefined,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        schedules,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logCourseUpdate(
        courseId,
        title,
        session.user.id,
        session.user.name || "Profesor",
        { title, description, externalUrl, startDate: startDateStr, endDate: endDateStr }
    );

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/admin");
}

export async function deleteCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const confirmText = formData.get("confirmText") as string;

    if (confirmText !== "ELIMINAR") {
        throw new Error("Confirmación incorrecta");
    }

    // Get course info before deletion
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
    });

    // TODO: Add check if teacher owns the course if not admin
    await courseService.deleteCourse(courseId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logCourseDelete(
        courseId,
        course?.title || "Curso",
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/admin");
}

export async function createActivityAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const statement = formData.get("statement") as string;
    const filePaths = formData.get("filePaths") as string;
    const deadlineStr = formData.get("deadline") as string;
    const openDateStr = formData.get("openDate") as string;
    const courseId = formData.get("courseId") as string;
    const type = formData.get("type") as "GITHUB" | "MANUAL" | "GOOGLE_COLAB";
    const weightStr = formData.get("weight") as string;
    const maxAttemptsStr = formData.get("maxAttempts") as string;
    const allowLinkSubmissionStr = formData.get("allowLinkSubmission") as string;

    const activity = await activityService.createActivity({
        title,
        description,
        statement,
        filePaths,
        deadline: deadlineStr ? new Date(deadlineStr) : new Date(),
        openDate: openDateStr ? new Date(openDateStr) : undefined,
        courseId,
        type: type || "GITHUB",
        weight: weightStr ? parseFloat(weightStr) : 1.0,
        maxAttempts: maxAttemptsStr ? parseInt(maxAttemptsStr) : 1,
        allowLinkSubmission: allowLinkSubmissionStr === "true",
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logActivityCreate(
        activity.id,
        title,
        courseId,
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function updateActivityAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("activityId") as string;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const statement = formData.get("statement") as string | null;
    const filePaths = formData.get("filePaths") as string | null;
    const deadlineStr = formData.get("deadline") as string | null;
    const openDateStr = formData.get("openDate") as string | null;
    const courseId = formData.get("courseId") as string;
    const type = formData.get("type") as "GITHUB" | "MANUAL" | "GOOGLE_COLAB" | null;
    const weightStr = formData.get("weight") as string | null;
    const maxAttemptsStr = formData.get("maxAttempts") as string | null;
    const allowLinkSubmissionStr = formData.get("allowLinkSubmission") as string | null;

    await activityService.updateActivity(id, {
        title: title || undefined,
        description: description || undefined,
        statement: statement || undefined,
        filePaths: filePaths || undefined,
        deadline: deadlineStr ? new Date(deadlineStr) : undefined,
        openDate: openDateStr ? new Date(openDateStr) : undefined,
        type: type || undefined,
        weight: weightStr ? parseFloat(weightStr) : undefined,
        maxAttempts: maxAttemptsStr ? parseInt(maxAttemptsStr) : undefined,
        allowLinkSubmission: allowLinkSubmissionStr ? allowLinkSubmissionStr === "true" : undefined,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "UPDATE",
        entity: "ACTIVITY",
        entityId: id,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Actividad actualizada: ${title || "Sin título"}`,
        success: true,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function deleteActivityAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const activityId = formData.get("activityId") as string;
    const courseId = formData.get("courseId") as string;
    const confirmText = (formData.get("confirmText") as string) || "";

    if (confirmText !== "ELIMINAR") {
        throw new Error("Confirmación inválida");
    }

    // Get activity info before deletion for audit log
    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { title: true }
    });

    await activityService.deleteActivity(activityId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "DELETE",
        entity: "ACTIVITY",
        entityId: activityId,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Actividad eliminada: ${activity?.title || "Desconocida"}`,
        success: true,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function addStudentToCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const userId = formData.get("userId") as string;
    const courseId = formData.get("courseId") as string;

    if (!userId || !courseId) {
        throw new Error("Missing required fields");
    }

    const enrollment = await courseService.enrollStudent(userId, courseId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    const [course, student] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await auditLogger.logEnrollment(
        enrollment.id,
        course?.title || "Curso",
        userId,
        student?.name || "Estudiante"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function searchStudentsAction(query: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    return await courseService.searchStudents(query);
}

export async function removeStudentFromCourseAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const userId = formData.get("userId") as string;
    const courseId = formData.get("courseId") as string;

    if (!userId || !courseId) {
        throw new Error("Missing required fields");
    }

    // Get info before removal for audit log
    const [course, student] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await courseService.removeStudentFromCourse(userId, courseId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.logUnenrollment(
        course?.title || "Curso",
        userId,
        student?.name || "Estudiante",
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function toggleCourseRegistrationAction(courseId: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    await courseService.toggleCourseRegistration(courseId);
    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");
}

export async function updateRegistrationSettingsAction(formData: FormData) {
    const session = await getSession();
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const courseId = formData.get("courseId") as string;
    const isOpen = formData.get("isOpen") === "true";
    const deadlineStr = formData.get("deadline") as string;

    await courseService.updateCourseRegistration(
        courseId,
        isOpen,
        deadlineStr ? new Date(deadlineStr) : undefined
    );

    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");
}

export async function enrollStudentAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const enrollment = await courseService.enrollStudent(session.user.id, courseId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
    });

    await auditLogger.logEnrollment(
        enrollment.id,
        course?.title || "Curso",
        session.user.id,
        session.user.name || "Estudiante"
    );

    revalidatePath("/dashboard/student");
}

export async function submitActivityAction(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        return { message: "Unauthorized", error: true };
    }

    const url = formData.get("url") as string;
    const activityId = formData.get("activityId") as string;

    try {
        const submission = await activityService.submitActivity({
            url,
            activityId,
            userId: session.user.id,
        });

        // 🎯 AUDIT LOG
        const { auditLogger } = await import("@/services/auditLogger");
        const { PrismaClient } = await import("@/generated/prisma/client");


        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            select: { title: true }
        });

        await auditLogger.logSubmission(
            submission.id,
            activity?.title || "Actividad",
            session.user.id,
            session.user.name || "Estudiante",
            submission.attemptCount
        );

        revalidatePath("/dashboard/student");
        return { message: "Entrega exitosa", error: false };
    } catch (error: any) {
        console.error("Submission error:", error);

        // 🎯 AUDIT LOG - Error
        const { auditLogger } = await import("@/services/auditLogger");
        await auditLogger.logError(
            "SUBMIT",
            "SUBMISSION",
            `Error al entregar actividad: ${error.message}`,
            error.message,
            session.user.id,
            session.user.name || "Estudiante"
        );

        return { message: error.message || "Error al realizar la entrega", error: true };
    }
}

export async function deleteSubmissionAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const submissionId = formData.get("submissionId") as string;
    const courseId = formData.get("courseId") as string;
    const activityId = formData.get("activityId") as string;

    if (!submissionId) {
        throw new Error("Missing submission ID");
    }

    // Get submission info before deletion
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            activity: { select: { title: true } },
            user: { select: { name: true } }
        }
    });

    await activityService.deleteSubmission(submissionId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "DELETE",
        entity: "SUBMISSION",
        entityId: submissionId,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Entrega eliminada: ${submission?.activity.title || "Actividad"} de ${submission?.user.name || "Estudiante"}`,
        success: true,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
    revalidatePath(`/dashboard/teacher/courses/${courseId}/activities/${activityId}`);
}

// Helper function to normalize URLs for comparison
function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Convert to lowercase
        let normalized = urlObj.href.toLowerCase();
        // Remove www.
        normalized = normalized.replace('://www.', '://');
        // Remove trailing slash
        normalized = normalized.replace(/\/$/, '');
        return normalized;
    } catch {
        // If URL parsing fails, just normalize the string
        return url.toLowerCase().trim();
    }
}

export async function validateUniqueLinksAction(activityId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    // Get all submissions for this activity
    const submissions = await prisma.submission.findMany({
        where: { activityId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    // Map to track normalized URLs and their associated students
    const urlMap = new Map<string, Array<{ id: string; name: string; email: string; originalUrl: string }>>();

    // Process each submission
    submissions.forEach(submission => {
        const normalizedUrl = normalizeUrl(submission.url);

        if (!urlMap.has(normalizedUrl)) {
            urlMap.set(normalizedUrl, []);
        }

        urlMap.get(normalizedUrl)!.push({
            id: submission.user.id,
            name: submission.user.name || 'Sin nombre',
            email: submission.user.email,
            originalUrl: submission.url
        });
    });

    // Find duplicates (URLs with more than one student)
    const duplicates: Array<{
        url: string;
        count: number;
        students: Array<{ id: string; name: string; email: string; originalUrl: string }>;
    }> = [];

    urlMap.forEach((students, url) => {
        if (students.length > 1) {
            duplicates.push({
                url,
                count: students.length,
                students
            });
        }
    });

    // Calculate statistics
    const totalSubmissions = submissions.length;
    const uniqueLinks = urlMap.size;
    const duplicateCount = duplicates.reduce((sum, dup) => sum + dup.count, 0);
    const uniqueCount = totalSubmissions - duplicateCount;

    return {
        totalSubmissions,
        uniqueLinks,
        uniqueCount,
        duplicateCount,
        duplicates,
        originalityPercentage: totalSubmissions > 0
            ? Math.round((uniqueCount / totalSubmissions) * 100)
            : 100
    };
}

export async function scanRepositoryAction(repoUrl: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { githubService } = await import("@/services/githubService");
    const repoInfo = githubService.parseGitHubUrl(repoUrl);

    if (!repoInfo) {
        throw new Error("Invalid GitHub URL");
    }

    return await githubService.getRepoStructure(repoInfo.owner, repoInfo.repo);
}


export async function fetchRepoFilesAction(repoUrl: string, filePaths: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { githubService } = await import("@/services/githubService");
    const repoInfo = githubService.parseGitHubUrl(repoUrl);
    if (!repoInfo) throw new Error("Invalid GitHub URL");

    const paths = filePaths.split(',').map(p => p.trim());
    const validFiles = [];
    const missingFiles = [];

    for (const path of paths) {
        const content = await githubService.getFileContent(repoInfo.owner, repoInfo.repo, path);
        if (content) {
            validFiles.push({ path, content });
        } else {
            missingFiles.push(path);
        }
    }

    return { validFiles, missingFiles };
}

export async function analyzeFileAction(filename: string, content: string, description: string, repoUrl: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { analyzeFile } = await import("@/services/gemini/codeAnalysisService");
    return await analyzeFile(filename, content, description, repoUrl, session.user.id);
}

export async function finalizeSubmissionAction(
    activityId: string,
    repoUrl: string,
    analyses: any[],
    description: string,
    missingFiles: string[]
) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { finalizeSubmission } = await import("@/services/gemini/gradingService");
    const result = await finalizeSubmission(analyses, description, missingFiles, session.user.id);

    // Save the submission
    await activityService.submitActivity({
        url: repoUrl,
        activityId,
        userId: session.user.id,
        grade: result.grade,
        feedback: result.feedback
    });

    revalidatePath("/dashboard/student");
    return result;
}

export async function gradeManualActivityAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const activityId = formData.get("activityId") as string;
    const userId = formData.get("userId") as string;
    const gradeStr = formData.get("grade") as string;
    const feedback = formData.get("feedback") as string;
    const courseId = formData.get("courseId") as string;

    if (!activityId || !userId || !gradeStr) {
        throw new Error("Faltan campos requeridos");
    }

    const grade = parseFloat(gradeStr);
    if (isNaN(grade) || grade < 0 || grade > 5) {
        throw new Error("La nota debe estar entre 0.0 y 5.0");
    }

    // Get existing submission to preserve the URL
    const existingSubmission = await activityService.getSubmission(activityId, userId);
    const url = existingSubmission?.url || "MANUAL"; // Use existing URL or placeholder if none exists

    await activityService.submitActivity({
        url,
        activityId,
        userId,
        grade,
        feedback
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");


    const [activity, student] = await Promise.all([
        prisma.activity.findUnique({ where: { id: activityId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await auditLogger.logGrade(
        existingSubmission?.id || "new",
        activity?.title || "Actividad",
        student?.name || "Estudiante",
        grade,
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}/activities/${activityId}`);
}

export async function reorderActivitiesAction(courseId: string, activityIds: string[]) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    await activityService.reorderActivities(courseId, activityIds);
    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function redistributeWeightsAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const activities = await activityService.getCourseActivities(courseId);
    if (activities.length === 0) return;

    const newWeight = 100 / activities.length;
    await activityService.updateAllActivityWeights(courseId, newWeight);
    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getStudentCourseEnrollmentAction(userId: string, courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    return await courseService.getStudentCourseEnrollment(userId, courseId);
}

export async function improveFeedbackAction(text: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { improveFeedback } = await import("@/services/gemini/feedbackService");
    return await improveFeedback(text, session.user.id);
}

export async function getProfileAction() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { profileService } = await import("@/services/profileService");
    return await profileService.getProfile(session.user.id);
}

export async function updateProfileAction(formData: FormData) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const identificacion = formData.get("identificacion") as string;
    const nombres = formData.get("nombres") as string;
    const apellido = formData.get("apellido") as string;
    const telefono = formData.get("telefono") as string | null;
    const geminiApiKey = formData.get("geminiApiKey") as string | null;

    if (geminiApiKey) {
        const { encrypt } = await import("@/lib/encryption");
        const encryptedKey = await encrypt(geminiApiKey);


        await prisma.user.update({
            where: { id: session.user.id },
            data: { encryptedGeminiApiKey: encryptedKey }
        });
    }

    const { profileService } = await import("@/services/profileService");
    await profileService.upsertProfile(session.user.id, {
        identificacion,
        nombres,
        apellido,
        telefono: telefono || undefined,
    });

    revalidatePath("/");
}

export async function getGeminiApiKeyModeAction() {
    const session = await getSession();
    if (!session?.user) return null;

    const settings = await prisma.systemSettings.findUnique({
        where: { id: "settings" },
        select: { geminiApiKeyMode: true }
    });

    // Check if user has a key set
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { encryptedGeminiApiKey: true }
    });

    return {
        mode: settings?.geminiApiKeyMode || "GLOBAL",
        hasUserKey: !!user?.encryptedGeminiApiKey
    };
}

export async function recordAttendanceAction(
    courseId: string,
    userId: string,
    date: Date,
    status: "PRESENT" | "ABSENT" | "EXCUSED"
) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { attendanceService } = await import("@/services/attendanceService");
    const attendance = await attendanceService.recordAttendance(courseId, userId, date, status);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    const [course, student] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await auditLogger.logAttendance(
        attendance.id,
        course?.title || "Curso",
        student?.name || "Estudiante",
        status,
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getStudentAttendanceStatsAction(courseId: string, userId: string) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Allow teacher to view any student, or student to view their own
    if (session.user.role === "student" && session.user.id !== userId) {
        throw new Error("Unauthorized");
    }

    const { attendanceService } = await import("@/services/attendanceService");
    return await attendanceService.getStudentAttendanceStats(courseId, userId);
}

export async function getCourseStudentsAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getCourseStudents(courseId);
}

export async function generateLateCodeAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }
    const { attendanceService } = await import("@/services/attendanceService");
    return await attendanceService.generateLateCode(courseId);
}

export async function deleteLateCodeAction(courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }
    const { attendanceService } = await import("@/services/attendanceService");
    return await attendanceService.deleteLateCode(courseId);
}

export async function registerLateArrivalAction(courseId: string, code: string, justification: string) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    const { attendanceService } = await import("@/services/attendanceService");
    return await attendanceService.registerLateArrival(courseId, session.user.id, code, justification);
}

export async function registerAbsenceJustificationAction(courseId: string, date: Date, url: string | undefined | null, reason: string) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    const { attendanceService } = await import("@/services/attendanceService");
    return await attendanceService.registerAbsenceJustification(courseId, session.user.id, date, url, reason);
}

export async function deleteJustificationAction(attendanceId: string, courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { attendanceService } = await import("@/services/attendanceService");
    await attendanceService.deleteJustification(attendanceId);
    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

// Remark Actions
export async function createRemarkAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const type = formData.get("type") as "ATTENTION" | "COMMENDATION";
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const courseId = formData.get("courseId") as string;
    const userId = formData.get("userId") as string;

    console.log("SERVER ACTION: createRemarkAction received:", { type, title, description, courseId, userId });

    const { remarkService } = await import("@/services/remarkService");
    const remark = await remarkService.createRemark({
        type,
        title,
        description,
        courseId,
        userId,
        teacherId: session.user.id,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    const [course, student] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    ]);

    await auditLogger.logRemark(
        remark.id,
        type,
        student?.name || "Estudiante",
        course?.title || "Curso",
        session.user.id,
        session.user.name || "Profesor"
    );

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getStudentRemarksAction(courseId: string, userId: string) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Allow teacher to view any student, or student to view their own
    if (session.user.role === "student" && session.user.id !== userId) {
        throw new Error("Unauthorized");
    }

    const { remarkService } = await import("@/services/remarkService");
    return await remarkService.getStudentRemarks(courseId, userId);
}

export async function updateRemarkAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const remarkId = formData.get("remarkId") as string;
    const type = formData.get("type") as "ATTENTION" | "COMMENDATION" | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const courseId = formData.get("courseId") as string;

    const { remarkService } = await import("@/services/remarkService");
    await remarkService.updateRemark(remarkId, {
        ...(type && { type }),
        ...(title && { title }),
        ...(description && { description }),
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "UPDATE",
        entity: "REMARK",
        entityId: remarkId,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Observación actualizada: ${title || "Sin título"}`,
        success: true,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function deleteRemarkAction(remarkId: string, courseId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    // Get remark info before deletion
    const remark = await prisma.remark.findUnique({
        where: { id: remarkId },
        select: { title: true, type: true }
    });

    const { remarkService } = await import("@/services/remarkService");
    await remarkService.deleteRemark(remarkId);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "DELETE",
        entity: "REMARK",
        entityId: remarkId,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Observación eliminada: ${remark?.title || "Sin título"} (${remark?.type})`,
        success: true,
    });

    revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function getCalendarEventsAction(studentId?: string) {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getCalendarEvents(
        session.user.id,
        session.user.role || "student",
        studentId
    );
}

export async function getStudentsForTeacherAction() {
    const session = await getSession();
    if (!session?.user || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { courseService } = await import("@/services/courseService");
    return await courseService.getStudentsForTeacher(session.user.id);
}

export async function getScheduleViewAction() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === "teacher") {
        const courses = await courseService.getTeacherCourses(userId);
        // Filter active courses for schedule view
        const now = new Date();
        // Reset time part to ensure we include courses ending today
        now.setHours(0, 0, 0, 0);

        return courses.filter(c => !c.endDate || new Date(c.endDate) >= now);
    } else {
        return await courseService.getStudentCourses(userId);
    }
}

// Notification Actions
export async function createNotificationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const target = formData.get("target") as "ALL_COURSES" | "SPECIFIC_COURSE" | "SPECIFIC_STUDENTS";
    const courseId = formData.get("courseId") as string | null;
    const studentIdsStr = formData.get("studentIds") as string | null;

    let studentIds: string[] = [];
    if (studentIdsStr) {
        try {
            studentIds = JSON.parse(studentIdsStr);
        } catch (e) {
            console.error("Failed to parse studentIds", e);
        }
    }

    const { notificationService } = await import("@/services/notificationService");
    const notification = await notificationService.createNotification({
        title,
        message,
        target,
        teacherId: session.user.id,
        courseId: courseId || undefined,
        studentIds,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    // Calculate recipient count based on target
    let recipientCount = 0;
    if (target === "SPECIFIC_STUDENTS") {
        recipientCount = studentIds.length;
    } else if (target === "SPECIFIC_COURSE" && courseId) {
        const enrollmentCount = await prisma.enrollment.count({
            where: { courseId }
        });
        recipientCount = enrollmentCount;
    } else if (target === "ALL_COURSES") {
        const enrollmentCount = await prisma.enrollment.count({
            where: {
                course: { teacherId: session.user.id }
            }
        });
        recipientCount = enrollmentCount;
    }

    await auditLogger.logNotification(
        notification.id,
        title,
        target,
        session.user.id,
        session.user.name || "Profesor",
        recipientCount
    );

    revalidatePath("/dashboard/teacher/notifications");
    revalidatePath("/dashboard/student/notifications");
}

export async function updateNotificationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("notificationId") as string;
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const target = formData.get("target") as "ALL_COURSES" | "SPECIFIC_COURSE" | "SPECIFIC_STUDENTS";
    const courseId = formData.get("courseId") as string | null;
    const studentIdsStr = formData.get("studentIds") as string | null;

    let studentIds: string[] | undefined;
    if (studentIdsStr) {
        try {
            studentIds = JSON.parse(studentIdsStr);
        } catch (e) {
            console.error("Failed to parse studentIds", e);
        }
    }

    const { notificationService } = await import("@/services/notificationService");
    await notificationService.updateNotification(id, {
        title,
        message,
        target,
        courseId: courseId || undefined,
        studentIds,
    });

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "UPDATE",
        entity: "NOTIFICATION",
        entityId: id,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Notificación actualizada: "${title}"`,
        metadata: { target },
        success: true,
    });

    revalidatePath("/dashboard/teacher/notifications");
    revalidatePath("/dashboard/student/notifications");
}

export async function deleteNotificationAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("notificationId") as string;

    // Get notification info before deletion
    const notification = await prisma.notification.findUnique({
        where: { id },
        select: { title: true }
    });

    const { notificationService } = await import("@/services/notificationService");
    await notificationService.deleteNotification(id);

    // 🎯 AUDIT LOG
    const { auditLogger } = await import("@/services/auditLogger");
    await auditLogger.log({
        action: "DELETE",
        entity: "NOTIFICATION",
        entityId: id,
        userId: session.user.id,
        userName: session.user.name || "Profesor",
        userRole: session.user.role,
        description: `Notificación eliminada: "${notification?.title || "Sin título"}"`,
        success: true,
    });

    revalidatePath("/dashboard/teacher/notifications");
    revalidatePath("/dashboard/student/notifications");
}

export async function getTeacherNotificationsAction() {
    const session = await getSession();
    if (!session || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const { notificationService } = await import("@/services/notificationService");
    return await notificationService.getTeacherNotifications(session.user.id);
}

export async function getStudentNotificationsAction() {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { notificationService } = await import("@/services/notificationService");
    return await notificationService.getStudentNotificationsWithReadStatus(session.user.id);
}

export async function markNotificationAsReadAction(notificationId: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { notificationService } = await import("@/services/notificationService");
    await notificationService.markNotificationAsRead(notificationId, session.user.id);
    revalidatePath("/dashboard/student/notifications");
}

export async function markAllNotificationsAsReadAction() {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { notificationService } = await import("@/services/notificationService");
    await notificationService.markAllAsRead(session.user.id);
    revalidatePath("/dashboard/student/notifications");
}

export async function getUnreadNotificationCountAction() {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        return 0;
    }

    const { notificationService } = await import("@/services/notificationService");
    return await notificationService.getUnreadNotificationCount(session.user.id);
}

export async function gradeGoogleColabAction(activityId: string, colabUrl: string, description: string) {
    const session = await getSession();
    if (!session || session.user.role !== "student") {
        throw new Error("Unauthorized");
    }

    const { gradeGoogleColabSubmission } = await import("@/services/gemini/gradingService");
    const result = await gradeGoogleColabSubmission(description, colabUrl, session.user.id);

    // Save the submission
    await activityService.submitActivity({
        url: colabUrl,
        activityId,
        userId: session.user.id,
        grade: result.grade,
        feedback: result.feedback
    });

    revalidatePath("/dashboard/student");
    return result;
}

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS & SETTINGS ACTIONS
// -----------------------------------------------------------------------------

import { announcementService } from "@/services/announcementService";
import { settingsService } from "@/services/settingsService";

export async function getAnnouncementsAction() {
    const session = await getSession();
    // Visible to everyone, but admin sees all
    const isAdmin = session?.user?.role === "admin";
    return await announcementService.getAnnouncements(!isAdmin);
}

export async function createAnnouncementAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const visible = formData.get("visible") === "true";
    const showImage = formData.get("showImage") === "true";
    const imagePosition = formData.get("imagePosition") as string;
    const type = formData.get("type") as "INFO" | "URGENT" | "EVENT" | "MAINTENANCE" | "SUCCESS" | "WARNING" | "NEWSLETTER" | "CELEBRATION";

    // Extract and convert date fields
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    await announcementService.createAnnouncement({
        title,
        content,
        imageUrl: imageUrl || undefined,
        showImage,
        imagePosition: imagePosition || "LEFT",
        startDate,
        endDate,
        authorId: session.user.id,
        visible,
        type
    });

    revalidatePath("/dashboard/home");
    revalidatePath("/dashboard/admin/announcements");
}

export async function updateAnnouncementAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const visible = formData.get("visible") === "true";
    const showImage = formData.get("showImage") === "true";
    const imagePosition = formData.get("imagePosition") as string;
    const type = formData.get("type") as "INFO" | "URGENT" | "EVENT" | "MAINTENANCE" | "SUCCESS" | "WARNING" | "NEWSLETTER" | "CELEBRATION";

    // Extract and convert date fields
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    await announcementService.updateAnnouncement(id, {
        title,
        content,
        imageUrl: imageUrl || undefined,
        showImage,
        imagePosition: imagePosition || "LEFT",
        startDate,
        endDate,
        visible,
        type
    });

    revalidatePath("/dashboard/home");
    revalidatePath("/dashboard/admin/announcements");
}

export async function deleteAnnouncementAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    await announcementService.deleteAnnouncement(id);

    revalidatePath("/dashboard/home");
    revalidatePath("/dashboard/admin/announcements");
}

export async function getSettingsAction() {
    // Publicly accessible for branding
    return await settingsService.getSettings();
}

export async function updateSettingsAction(formData: FormData) {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const institutionName = (formData.get("institutionName") as string) || null;
    const institutionLogo = (formData.get("institutionLogo") as string) || null;
    const institutionHeroImage = (formData.get("institutionHeroImage") as string) || null;

    console.log("updateSettingsAction processing:", { institutionName, institutionLogo, institutionHeroImage });

    await settingsService.updateSettings({
        institutionName,
        institutionLogo,
        institutionHeroImage
    });

    revalidatePath("/");
    revalidatePath("/dashboard/home");
}
