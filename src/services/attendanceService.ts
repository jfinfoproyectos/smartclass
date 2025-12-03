
import { AttendanceStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";


export const attendanceService = {
    async recordAttendance(
        courseId: string,
        userId: string,
        date: Date,
        status: AttendanceStatus
    ) {
        // Normalize date to start of day to avoid duplicate entries for the same day with different times
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        return await prisma.attendance.upsert({
            where: {
                courseId_userId_date: {
                    courseId,
                    userId,
                    date: normalizedDate,
                },
            },
            update: {
                status,
            },
            create: {
                courseId,
                userId,
                date: normalizedDate,
                status,
            },
        });
    },

    async generateLateCode(courseId: string) {
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        return await prisma.course.update({
            where: { id: courseId },
            data: {
                lateCode: code,
                lateCodeExpiresAt: null, // Permanent code
            },
        });
    },

    async deleteLateCode(courseId: string) {
        return await prisma.course.update({
            where: { id: courseId },
            data: {
                lateCode: null,
                lateCodeExpiresAt: null,
            },
        });
    },

    async registerLateArrival(courseId: string, userId: string, code: string, justification: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || !course.lateCode) {
            throw new Error("No hay un código activo para este curso.");
        }

        if (course.lateCode !== code) {
            throw new Error("Código inválido.");
        }

        // Only check expiration if it exists (backward compatibility or future use)
        if (course.lateCodeExpiresAt && new Date() > course.lateCodeExpiresAt) {
            throw new Error("El código ha expirado.");
        }

        // Find existing attendance record close to now (to handle timezone differences)
        // We look for a record within +/- 24 hours
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingRecord = await prisma.attendance.findFirst({
            where: {
                courseId,
                userId,
                date: {
                    gte: yesterday,
                    lte: tomorrow
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // If we found a record, use its date to ensure we update it instead of creating a new one
        // If not, use the current server date normalized
        let targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);

        if (existingRecord) {
            targetDate = existingRecord.date;
        }

        return await prisma.attendance.upsert({
            where: {
                courseId_userId_date: {
                    courseId,
                    userId,
                    date: targetDate,
                },
            },
            update: {
                status: "LATE",
                arrivalTime: new Date(),
                justification,
            },
            create: {
                courseId,
                userId,
                date: targetDate,
                status: "LATE",
                arrivalTime: new Date(),
                justification,
            },
        });
    },

    async registerAbsenceJustification(courseId: string, userId: string, date: Date, url: string | undefined | null, reason: string) {
        // Validate Google Drive URL if provided
        if (url) {
            const googleDriveRegex = /^https:\/\/(drive|docs)\.google\.com\/.+/;
            if (!googleDriveRegex.test(url)) {
                throw new Error("El enlace debe ser de Google Drive o Google Docs.");
            }

            // Check if URL is accessible (public)
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error("El enlace no es accesible. Asegúrate de que sea público.");
                }
            } catch (error) {
                throw new Error("No se pudo verificar el enlace. Asegúrate de que sea válido y público.");
            }
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        return await prisma.attendance.upsert({
            where: {
                courseId_userId_date: {
                    courseId,
                    userId,
                    date: normalizedDate,
                },
            },
            update: {
                status: "EXCUSED",
                justification: reason,
                justificationUrl: url,
            },
            create: {
                courseId,
                userId,
                date: normalizedDate,
                status: "EXCUSED",
                justification: reason,
                justificationUrl: url,
            },
        });
    },

    async deleteJustification(attendanceId: string) {
        const record = await prisma.attendance.findUnique({
            where: { id: attendanceId },
        });

        if (!record) {
            throw new Error("Registro de asistencia no encontrado");
        }

        if (record.status === "EXCUSED") {
            // If excused, revert to ABSENT and clear justification
            return await prisma.attendance.update({
                where: { id: attendanceId },
                data: {
                    status: "ABSENT",
                    justification: null,
                    justificationUrl: null,
                },
            });
        } else if (record.status === "LATE") {
            // If late, keep LATE but clear justification
            return await prisma.attendance.update({
                where: { id: attendanceId },
                data: {
                    justification: null,
                    justificationUrl: null,
                },
            });
        } else {
            throw new Error("No hay justificación para eliminar en este registro");
        }
    },

    async deleteAttendanceRecord(attendanceId: string) {
        const record = await prisma.attendance.findUnique({
            where: { id: attendanceId },
        });

        if (!record) {
            throw new Error("Registro de asistencia no encontrado");
        }

        // Completely delete the attendance record
        return await prisma.attendance.delete({
            where: { id: attendanceId },
        });
    },

    async getCourseAttendance(courseId: string) {
        return await prisma.attendance.findMany({
            where: { courseId },
            orderBy: { date: "desc" },
        });
    },

    async getStudentAttendanceStats(courseId: string, userId: string) {
        // Get all attendance records for this student in this course
        const studentRecords = await prisma.attendance.findMany({
            where: { courseId, userId },
            orderBy: { date: "desc" },
        });

        // Get all unique dates recorded for this course to calculate total sessions
        // This assumes that if attendance was taken for ANY student on a date, it counts as a session
        const allCourseRecords = await prisma.attendance.findMany({
            where: { courseId },
            select: { date: true },
            distinct: ["date"],
        });

        const totalSessions = allCourseRecords.length;
        const absences = studentRecords.filter(
            (r) => r.status === AttendanceStatus.ABSENT
        ).length;
        const presents = studentRecords.filter(
            (r) => r.status === AttendanceStatus.PRESENT
        ).length;
        const excused = studentRecords.filter(
            (r) => r.status === AttendanceStatus.EXCUSED
        ).length;
        const late = studentRecords.filter(
            (r) => r.status === "LATE"
        ).length;

        // Calculate percentage: (Present + Excused + Late) / Total Sessions
        // Assuming Late counts as present for percentage purposes, or maybe partial? 
        // Usually Late is better than Absent. Let's count it as present for now or just separate.
        // The user didn't specify, but usually Late is not Absent.
        const attendancePercentage =
            totalSessions > 0 ? ((presents + excused + late) / totalSessions) * 100 : 100;

        return {
            totalSessions,
            absences,
            presents,
            excused,
            late,
            attendancePercentage,
            records: studentRecords,
        };
    },
};
