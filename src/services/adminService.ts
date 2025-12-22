import prisma from "@/lib/prisma";


export const adminService = {
    // ============ DASHBOARD METRICS ============


    // ============ USER MANAGEMENT ============
    async getAllUsers(filters?: {
        role?: "teacher" | "student" | "admin";
        search?: string;
        courseId?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        const andConditions: any[] = [];

        if (filters?.role) {
            where.role = filters.role;
        }

        if (filters?.courseId && filters.courseId !== 'all') {
            andConditions.push({
                OR: [
                    // Student enrolled in course
                    { enrollments: { some: { courseId: filters.courseId } } },
                    // Teacher who created the course
                    { coursesCreated: { some: { id: filters.courseId } } }
                ]
            });
        }

        if (filters?.search) {
            andConditions.push({
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' as const } },
                    { email: { contains: filters.search, mode: 'insensitive' as const } }
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true,
                    _count: {
                        select: {
                            coursesCreated: true,
                            enrollments: true,
                            submissions: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        return { users, total };
    },

    async getUserDetails(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                coursesCreated: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                                activities: true
                            }
                        }
                    }
                },
                enrollments: {
                    include: {
                        course: {
                            include: {
                                teacher: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                submissions: {
                    include: {
                        activity: {
                            include: {
                                course: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                remarks: {
                    include: {
                        course: true,
                        teacher: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                attendances: {
                    include: {
                        user: true,
                        course: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    },
                    orderBy: { date: 'desc' }
                }
            }
        });
    },

    async updateUserRole(userId: string, newRole: "teacher" | "student" | "admin") {
        return await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });
    },

    async toggleUserBan(userId: string, banned: boolean) {
        return await prisma.user.update({
            where: { id: userId },
            data: { banned }
        });
    },

    async deleteUser(userId: string) {
        // This will cascade delete related records based on schema
        return await prisma.user.delete({
            where: { id: userId }
        });
    },

    // ============ COURSE MANAGEMENT ============
    async getAllCoursesAdmin(filters?: {
        status?: 'active' | 'archived' | 'all';
        teacherId?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        const andConditions: any[] = [];

        if (filters?.status === 'active') {
            andConditions.push({
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            });
        } else if (filters?.status === 'archived') {
            where.endDate = { lt: new Date() };
        }

        if (filters?.teacherId) {
            where.teacherId = filters.teacherId;
        }

        if (filters?.search) {
            andConditions.push({
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' as const } },
                    { description: { contains: filters.search, mode: 'insensitive' as const } }
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                orderBy: { createdAt: 'desc' },
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            activities: true
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);

        return { courses, total };
    },

    async getCourseDetailsAdmin(courseId: string) {
        return await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: true,
                enrollments: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                activities: {
                    include: {
                        _count: {
                            select: {
                                submissions: true
                            }
                        }
                    }
                },
                remarks: {
                    include: {
                        user: true,
                        teacher: true
                    }
                },
                attendances: {
                    include: {
                        user: true,
                        course: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    },
                    orderBy: { date: 'desc' }
                }
            }
        });
    },

    async reassignCourseTeacher(courseId: string, newTeacherId: string) {
        return await prisma.course.update({
            where: { id: courseId },
            data: { teacherId: newTeacherId }
        });
    },



    async getAllCoursesSimple() {
        return await prisma.course.findMany({
            // Fetch all courses for filtering, regardless of date
            where: {},
            select: {
                id: true,
                title: true
            },
            orderBy: {
                title: 'asc'
            }
        });
    },

    // ============ NOTIFICATION MANAGEMENT ============


    // ============ SYSTEM STATISTICS ============


    // ============ AUDIT LOGS (Simple version) ============
    async getRecentActivity(limit: number = 20) {
        // Get recent submissions as activity indicator
        const recentSubmissions = await prisma.submission.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                activity: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        course: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });

        return recentSubmissions.map(sub => ({
            type: 'submission',
            timestamp: sub.createdAt,
            user: sub.user,
            details: {
                activity: sub.activity.title,
                course: sub.activity.course.title,
                grade: sub.grade
            }
        }));
    }
};
