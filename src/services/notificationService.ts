import prisma from "@/lib/prisma";

;

export const notificationService = {
    async createNotification(data: {
        title: string;
        message: string;
        target: "ALL_COURSES" | "SPECIFIC_COURSE" | "SPECIFIC_STUDENTS";
        teacherId: string;
        courseId?: string;
        studentIds?: string[];
    }) {
        return await prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                target: data.target,
                teacherId: data.teacherId,
                courseId: data.courseId,
                studentIds: data.studentIds || [],
            },
        });
    },

    async updateNotification(id: string, data: {
        title?: string;
        message?: string;
        target?: "ALL_COURSES" | "SPECIFIC_COURSE" | "SPECIFIC_STUDENTS";
        courseId?: string;
        studentIds?: string[];
    }) {
        return await prisma.notification.update({
            where: { id },
            data: {
                title: data.title,
                message: data.message,
                target: data.target,
                courseId: data.courseId,
                studentIds: data.studentIds,
            },
        });
    },

    async deleteNotification(id: string) {
        return await prisma.notification.delete({
            where: { id },
        });
    },

    async getTeacherNotifications(teacherId: string) {
        return await prisma.notification.findMany({
            where: { teacherId },
            include: {
                course: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getStudentNotifications(studentId: string) {
        // Get all courses the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: studentId },
            select: { courseId: true },
        });

        const courseIds = enrollments.map(e => e.courseId);

        // Get notifications that target:
        // 1. All courses from teachers of student's courses
        // 2. Specific courses the student is enrolled in
        // 3. Specific students including this student
        return await prisma.notification.findMany({
            where: {
                OR: [
                    // ALL_COURSES: notifications from teachers of student's courses
                    {
                        target: "ALL_COURSES",
                        teacher: {
                            coursesCreated: {
                                some: {
                                    id: { in: courseIds },
                                },
                            },
                        },
                    },
                    // SPECIFIC_COURSE: notifications for courses student is enrolled in
                    {
                        target: "SPECIFIC_COURSE",
                        courseId: { in: courseIds },
                    },
                    // SPECIFIC_STUDENTS: notifications that include this student
                    {
                        target: "SPECIFIC_STUDENTS",
                        studentIds: { has: studentId },
                    },
                ],
            },
            include: {
                course: {
                    select: {
                        title: true,
                    },
                },
                teacher: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getNotificationById(id: string) {
        return await prisma.notification.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        title: true,
                    },
                },
            },
        });
    },

    // New methods for read/unread tracking
    async getStudentNotificationsWithReadStatus(studentId: string) {
        // Get all courses the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: studentId },
            select: { courseId: true },
        });

        const courseIds = enrollments.map(e => e.courseId);

        // Get notifications with read status
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    {
                        target: "ALL_COURSES",
                        teacher: {
                            coursesCreated: {
                                some: {
                                    id: { in: courseIds },
                                },
                            },
                        },
                    },
                    {
                        target: "SPECIFIC_COURSE",
                        courseId: { in: courseIds },
                    },
                    {
                        target: "SPECIFIC_STUDENTS",
                        studentIds: { has: studentId },
                    },
                ],
            },
            include: {
                course: {
                    select: {
                        title: true,
                    },
                },
                teacher: {
                    select: {
                        name: true,
                    },
                },
                reads: {
                    where: {
                        userId: studentId,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Add isRead flag to each notification
        return notifications.map(notification => ({
            ...notification,
            isRead: notification.reads.length > 0,
        }));
    },

    async markNotificationAsRead(notificationId: string, userId: string) {
        // Use upsert to avoid duplicate entries
        return await prisma.notificationRead.upsert({
            where: {
                notificationId_userId: {
                    notificationId,
                    userId,
                },
            },
            update: {
                readAt: new Date(),
            },
            create: {
                notificationId,
                userId,
            },
        });
    },

    async getUnreadNotificationCount(studentId: string) {
        // Get all courses the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: studentId },
            select: { courseId: true },
        });

        const courseIds = enrollments.map(e => e.courseId);

        // Get all notifications for the student
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    {
                        target: "ALL_COURSES",
                        teacher: {
                            coursesCreated: {
                                some: {
                                    id: { in: courseIds },
                                },
                            },
                        },
                    },
                    {
                        target: "SPECIFIC_COURSE",
                        courseId: { in: courseIds },
                    },
                    {
                        target: "SPECIFIC_STUDENTS",
                        studentIds: { has: studentId },
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        const notificationIds = notifications.map(n => n.id);

        // Count how many have NOT been read
        const readCount = await prisma.notificationRead.count({
            where: {
                userId: studentId,
                notificationId: { in: notificationIds },
            },
        });

        return notificationIds.length - readCount;
    },

    async markAllAsRead(studentId: string) {
        // Get all notifications for the student
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: studentId },
            select: { courseId: true },
        });

        const courseIds = enrollments.map(e => e.courseId);

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    {
                        target: "ALL_COURSES",
                        teacher: {
                            coursesCreated: {
                                some: {
                                    id: { in: courseIds },
                                },
                            },
                        },
                    },
                    {
                        target: "SPECIFIC_COURSE",
                        courseId: { in: courseIds },
                    },
                    {
                        target: "SPECIFIC_STUDENTS",
                        studentIds: { has: studentId },
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        // Create read records for all unread notifications
        const createPromises = notifications.map(notification =>
            prisma.notificationRead.upsert({
                where: {
                    notificationId_userId: {
                        notificationId: notification.id,
                        userId: studentId,
                    },
                },
                update: {
                    readAt: new Date(),
                },
                create: {
                    notificationId: notification.id,
                    userId: studentId,
                },
            })
        );

        await Promise.all(createPromises);
        return { count: createPromises.length };
    },
};
