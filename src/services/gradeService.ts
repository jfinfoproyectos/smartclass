import prisma from "@/lib/prisma";

export const gradeService = {
    async getGradeCategories(courseId: string) {
        return await prisma.gradeCategory.findMany({
            where: { courseId },
            include: {
                groups: {
                    include: {
                        items: {
                            include: {
                                activity: {
                                    select: { id: true, title: true, type: true }
                                },
                                evaluationAttempt: {
                                    include: {
                                        evaluation: {
                                            select: { id: true, title: true }
                                        }
                                    }
                                }
                            },
                            orderBy: { createdAt: "asc" }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "asc" }
        });
    },

    async createGradeCategory(data: { name: string; weight: number; courseId: string }) {
        return await prisma.gradeCategory.create({
            data
        });
    },

    async updateGradeCategory(id: string, data: { name?: string; weight?: number }) {
        return await prisma.gradeCategory.update({
            where: { id },
            data
        });
    },

    async deleteGradeCategory(id: string) {
        return await prisma.gradeCategory.delete({
            where: { id }
        });
    },

    async getGradeGroups(courseId: string) {
        // ... (can keep for flat access if needed, or point to category-based groups)
        return await prisma.gradeGroup.findMany({
            where: { courseId },
            include: {
                items: {
                    include: {
                        activity: {
                            select: { id: true, title: true, type: true }
                        },
                        evaluationAttempt: {
                            include: {
                                evaluation: {
                                    select: { id: true, title: true }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "asc" }
        });
    },

    async createGradeGroup(data: { name: string; weight: number; courseId: string; categoryId?: string }) {
        return await prisma.gradeGroup.create({
            data
        });
    },

    async updateGradeGroup(id: string, data: { name?: string; weight?: number }) {
        return await prisma.gradeGroup.update({
            where: { id },
            data
        });
    },

    async deleteGradeGroup(id: string) {
        return await prisma.gradeGroup.delete({
            where: { id }
        });
    },

    async addItemToGradeGroup(data: { 
        groupId: string; 
        activityId?: string; 
        evaluationAttemptId?: string; 
        weight: number 
    }) {
        // Ensure only one of activityId or evaluationAttemptId is provided
        if (data.activityId && data.evaluationAttemptId) {
            throw new Error("Specify either an activity or an evaluation, not both.");
        }

        return await prisma.gradeGroupItem.create({
            data
        });
    },

    async updateGradeGroupItem(id: string, weight: number) {
        return await prisma.gradeGroupItem.update({
            where: { id },
            data: { weight }
        });
    },

    async removeItemFromGradeGroup(id: string) {
        return await prisma.gradeGroupItem.delete({
            where: { id }
        });
    },

    async getCourseGradesData(courseId: string) {
        const [students, activities, evaluations, groups] = await Promise.all([
            prisma.enrollment.findMany({
                where: { courseId, status: "APPROVED" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            profile: {
                                select: {
                                    identificacion: true,
                                    nombres: true,
                                    apellido: true
                                }
                            }
                        }
                    }
                },
                orderBy: { user: { name: "asc" } }
            }),
            prisma.activity.findMany({
                where: { courseId },
                include: {
                    submissions: {
                        select: { userId: true, grade: true }
                    }
                }
            }),
            prisma.evaluationAttempt.findMany({
                where: { courseId },
                include: {
                    evaluation: { select: { title: true } },
                    submissions: {
                        select: { userId: true, score: true }
                    }
                }
            }),
            this.getGradeCategories(courseId)
        ]);

        return {
            students: students.map(s => ({
                id: s.user.id,
                name: s.user.name,
                email: s.user.email,
                image: s.user.image,
                profile: s.user.profile
            })),
            activities,
            evaluations,
            categories: groups // Reusing the 'groups' variable name from destructuring for now to avoid complexity in drift
        };
    }
};
