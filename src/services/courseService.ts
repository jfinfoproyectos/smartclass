import prisma from "@/lib/prisma";


export const courseService = {
    async createCourse(data: {
        title: string;
        description?: string;
        teacherId: string;
        startDate?: Date;
        endDate?: Date;
        externalUrl?: string;
        schedules?: Array<{
            dayOfWeek: string;
            startTime: string;
            endTime: string;
        }>;
    }) {
        const { schedules, ...courseData } = data;

        const course = await prisma.course.create({
            data: courseData,
        });

        // Create schedules if provided
        if (schedules && schedules.length > 0) {
            await prisma.courseSchedule.createMany({
                data: schedules.map(schedule => ({
                    courseId: course.id,
                    dayOfWeek: schedule.dayOfWeek as any,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                })),
            });
        }

        return course;
    },

    async cloneCourse(sourceCourseId: string, data: {
        title: string;
        description?: string;
        teacherId: string;
        startDate?: Date;
        endDate?: Date;
        externalUrl?: string;
        schedules?: Array<{
            dayOfWeek: string;
            startTime: string;
            endTime: string;
        }>;
    }) {
        // 1. Get source course with all data needed for cloning
        const sourceCourse = await prisma.course.findUnique({
            where: { id: sourceCourseId },
            include: {
                activities: true,
                schedules: true,
            }
        });

        if (!sourceCourse) {
            throw new Error("Course not found");
        }

        // 2. Create new course
        const { schedules, ...courseData } = data;
        const newCourse = await prisma.course.create({
            data: courseData,
        });

        // 3. Clone Schedules
        // Use provided schedules if any, otherwise clone from source
        const schedulesToCreate = schedules && schedules.length > 0
            ? schedules
            : sourceCourse.schedules.map(s => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime
            }));

        if (schedulesToCreate.length > 0) {
            await prisma.courseSchedule.createMany({
                data: schedulesToCreate.map(schedule => ({
                    courseId: newCourse.id,
                    dayOfWeek: schedule.dayOfWeek as any,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                })),
            });
        }

        // 4. Clone Activities
        if (sourceCourse.activities.length > 0) {
            // We need to create them one by one or createMany if we don't have complex relations on activities yet
            // Activities are simple for now
            await prisma.activity.createMany({
                data: sourceCourse.activities.map(activity => ({
                    courseId: newCourse.id,
                    title: activity.title,
                    description: activity.description,
                    statement: activity.statement,
                    filePaths: activity.filePaths,
                    type: activity.type,
                    weight: activity.weight,
                    maxAttempts: activity.maxAttempts,
                    allowLinkSubmission: activity.allowLinkSubmission,
                    // Keep dates? Or reset?
                    // For now, we keep them. The teacher can update them.
                    openDate: activity.openDate,
                    deadline: activity.deadline,
                    order: activity.order,
                }))
            });
        }

        return newCourse;
    },

    async updateCourse(courseId: string, data: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        externalUrl?: string;
        schedules?: Array<{
            dayOfWeek: string;
            startTime: string;
            endTime: string;
        }>;
    }) {
        const { schedules, ...courseData } = data;

        const course = await prisma.course.update({
            where: { id: courseId },
            data: courseData,
        });

        // Update schedules if provided
        if (schedules !== undefined) {
            // Delete existing schedules
            await prisma.courseSchedule.deleteMany({
                where: { courseId },
            });

            // Create new schedules
            if (schedules.length > 0) {
                await prisma.courseSchedule.createMany({
                    data: schedules.map(schedule => ({
                        courseId,
                        dayOfWeek: schedule.dayOfWeek as any,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime,
                    })),
                });
            }
        }

        return course;
    },

    async getTeacherCourses(teacherId: string) {
        return await prisma.course.findMany({
            where: { teacherId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { enrollments: true },
                },
                schedules: true,
            },
        });
    },

    async getStudentCourses(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'APPROVED',
                course: {
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date() } }
                    ]
                }
            },
            include: {
                course: {
                    include: {
                        schedules: true,
                        teacher: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });

        return enrollments.map(e => e.course);
    },

    async getAllCourses() {
        return await prisma.course.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                teacher: {
                    select: { name: true, email: true },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
        });
    },

    async getCourseById(courseId: string) {
        return await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    select: { id: true, name: true, email: true },
                },
                schedules: true,
                _count: {
                    select: {
                        enrollments: true,
                        activities: true
                    },
                },
            },
        });
    },

    async deleteCourse(courseId: string) {
        return await prisma.course.delete({
            where: { id: courseId },
        });
    },

    async enrollStudent(userId: string, courseId: string, status: 'PENDING' | 'APPROVED' = 'PENDING') {
        // Check if course registration is open
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                registrationOpen: true,
                registrationDeadline: true
            },
        });

        if (!course) {
            throw new Error("Course not found");
        }

        if (!course.registrationOpen) {
            throw new Error("Course registration is closed");
        }

        if (course.registrationDeadline && new Date() > course.registrationDeadline) {
            throw new Error("Course registration deadline has passed");
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        if (existing) return existing;

        return await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: status as any,
            },
        });
    },

    async getStudentEnrollments(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'APPROVED',
                course: {
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date() } }
                    ]
                }
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true },
                        },
                        activities: {
                            orderBy: { order: "asc" },
                            include: {
                                submissions: {
                                    where: { userId },
                                    orderBy: { createdAt: "desc" }
                                }
                            }
                        }
                    },
                },
            },
        });

        const now = new Date(); // Capture time once

        // Calculate weighted average grade for each course and fetch remarks/attendance
        // We do this manually or via separate queries because nested filtering on the same level (user -> remarks) 
        // within an enrollment query can be tricky or less efficient if not careful. 
        // But actually, we can just fetch them separately or use a more complex include.
        // Let's try to fetch them in parallel for all enrollments to be efficient, or just iterate.
        // Given the scale, iterating is fine for now, or we can use the relation on User if we included User.
        // But we didn't include User in the findMany above.

        // Let's fetch additional data for each enrollment
        const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            const activities = enrollment.course.activities;
            let totalWeightedGrade = 0;
            let totalWeight = 0;

            activities.forEach(activity => {
                const submission = activity.submissions[0];
                if (submission && submission.grade !== null) {
                    totalWeightedGrade += submission.grade * activity.weight;
                    totalWeight += activity.weight;
                } else if (!submission && activity.deadline && activity.deadline < now && activity.type !== 'MANUAL') {
                    // Missed deadline (and not manual without submission, assuming manual requires submission to be graded or marked?
                    // actually for MANUAL if teacher hasn't graded it might just be pending.
                    // But requirement says "actividades no entregadas".
                    // If it's manual and the teacher hasn't graded it, it might not be "submitted" in the system if it's purely offline.
                    // But usually "no entregadas" refers to things the student HAD to do.
                    // Safest bet for "no entregadas" implies the system knows it was expected.
                    // For GITHUB/COLAB/FILE it requires a submission record.
                    // For MANUAL with allowLinkSubmission=false, maybe the teacher grades directly.
                    // The prompt says "actividades no entregadas".
                    // Let's stick to: if no submission record AND deadline passed -> 0.0.
                    // This covers online submissions. For manual activities without online submission, it depends if the teacher creates a submission record or not.
                    // If the teacher just enters a grade, a submission record is created/upserted.
                    // So if no submission record exists and deadline passed, it counts as 0.
                    totalWeightedGrade += 0.0; // 0 * weight
                    totalWeight += activity.weight;
                }
            });

            const average = totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;

            // Fetch remarks and attendance for this course/user
            const remarks = await prisma.remark.findMany({
                where: {
                    courseId: enrollment.courseId,
                    userId: userId
                },
                orderBy: { date: "desc" }
            });

            const attendances = await prisma.attendance.findMany({
                where: {
                    courseId: enrollment.courseId,
                    userId: userId
                },
                orderBy: { date: "desc" }
            });

            return {
                ...enrollment,
                averageGrade: average,
                remarks,
                attendances
            };
        }));

        return enrichedEnrollments;
    },

    async getStudentPendingEnrollments(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'PENDING'
            },
            select: {
                courseId: true
            }
        });
        return enrollments.map(e => e.courseId);
    },

    async getPendingEnrollments(teacherId: string) {
        return await prisma.enrollment.findMany({
            where: {
                status: 'PENDING',
                course: {
                    teacherId: teacherId
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    async updateEnrollmentStatus(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
        // We no longer delete on REJECTED, we just update the status to suspend access
        return await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: status as any }
        });
    },

    async getActivity(activityId: string, userId: string) {
        // First check if user is enrolled and approved
        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            select: { courseId: true }
        });

        if (!activity) return null;

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: activity.courseId
                }
            }
        });

        if (!enrollment || enrollment.status !== 'APPROVED') {
            return null;
        }

        return await prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true, email: true },
                        },
                    },
                },
                submissions: {
                    where: { userId },
                },
            },
        });
    },

    async getCourseStudents(courseId: string) {
        return await prisma.enrollment.findMany({
            where: { courseId },
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
                                apellido: true,
                                telefono: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });
    },

    async searchStudents(query: string) {
        return await prisma.user.findMany({
            where: {
                role: "student",
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    {
                        profile: {
                            OR: [
                                { identificacion: { contains: query, mode: "insensitive" } },
                                { nombres: { contains: query, mode: "insensitive" } },
                                { apellido: { contains: query, mode: "insensitive" } },
                                { telefono: { contains: query, mode: "insensitive" } },
                            ],
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                profile: {
                    select: {
                        identificacion: true,
                        nombres: true,
                        apellido: true,
                        telefono: true,
                    },
                },
            },
            take: 10,
        });
    },

    async removeStudentFromCourse(userId: string, courseId: string) {
        return await prisma.enrollment.deleteMany({
            where: {
                userId,
                courseId,
            },
        });
    },

    async toggleCourseRegistration(courseId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { registrationOpen: true },
        });

        if (!course) {
            throw new Error("Course not found");
        }

        return await prisma.course.update({
            where: { id: courseId },
            data: { registrationOpen: !course.registrationOpen },
        });
    },

    async updateCourseRegistration(courseId: string, isOpen: boolean, deadline?: Date) {
        return await prisma.course.update({
            where: { id: courseId },
            data: {
                registrationOpen: isOpen,
                registrationDeadline: deadline
            },
        });
    },

    async getStudentCourseEnrollment(userId: string, courseId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true },
                        },
                        activities: {
                            orderBy: { order: "asc" },
                            include: {
                                submissions: {
                                    where: { userId },
                                    orderBy: { createdAt: "desc" }
                                }
                            }
                        }
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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
        });

        if (!enrollment) return null;

        // Calculate weighted average grade
        const activities = enrollment.course.activities;
        let totalWeightedGrade = 0;
        let totalWeight = 0;
        const now = new Date();

        activities.forEach(activity => {
            const submission = activity.submissions[0];
            if (submission && submission.grade !== null) {
                totalWeightedGrade += submission.grade * activity.weight;
                totalWeight += activity.weight;
            } else if (!submission && activity.deadline && activity.deadline < now && activity.type !== 'MANUAL') {
                // Missed deadline => 0.0
                totalWeightedGrade += 0.0;
                totalWeight += activity.weight;
            }
        });

        const average = totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;

        // Fetch remarks and attendance
        const remarks = await prisma.remark.findMany({
            where: {
                courseId: courseId,
                userId: userId
            },
            orderBy: { date: "desc" }
        });

        const attendances = await prisma.attendance.findMany({
            where: {
                courseId: courseId,
                userId: userId
            },
            orderBy: { date: "desc" }
        });

        return {
            ...enrollment,
            averageGrade: average,
            remarks,
            attendances
        };
    },

    async getCalendarEvents(userId: string, role: string, studentId?: string) {
        let courses;
        let absences: any[] = [];
        let remarks: any[] = [];

        if (role === "teacher") {
            courses = await prisma.course.findMany({
                where: { teacherId: userId },
                include: {
                    activities: true,
                },
            });

            // Fetch absences and remarks for teachers (all students in their courses)
            // Filter by studentId if provided
            if (studentId) {
                absences = await prisma.attendance.findMany({
                    where: {
                        course: { teacherId: userId },
                        userId: studentId,
                        status: { in: ["ABSENT", "LATE", "EXCUSED"] }
                    },
                    include: { course: { select: { title: true } } }
                });

                remarks = await prisma.remark.findMany({
                    where: {
                        course: { teacherId: userId },
                        userId: studentId
                    },
                    include: { course: { select: { title: true } } }
                });
            } else {
                absences = await prisma.attendance.findMany({
                    where: {
                        course: { teacherId: userId },
                        status: { in: ["ABSENT", "LATE", "EXCUSED"] }
                    },
                    include: { course: { select: { title: true } } }
                });

                remarks = await prisma.remark.findMany({
                    where: { course: { teacherId: userId } },
                    include: { course: { select: { title: true } } }
                });
            }
        } else {
            const enrollments = await prisma.enrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        include: {
                            activities: true,
                        },
                    },
                },
            });
            courses = enrollments.map(e => e.course);

            // Fetch absences and remarks for students
            absences = await prisma.attendance.findMany({
                where: {
                    userId,
                    status: { in: ["ABSENT", "LATE", "EXCUSED"] }
                },
                include: { course: { select: { title: true } } }
            });

            remarks = await prisma.remark.findMany({
                where: { userId },
                include: { course: { select: { title: true } } }
            });
        }

        const events: any[] = [];

        courses.forEach(course => {
            // Course Start
            if (course.startDate) {
                events.push({
                    id: `course-start-${course.id}`,
                    title: course.title,
                    startAt: course.startDate,
                    endAt: course.startDate,
                    status: { name: 'Inicio Curso', color: '#3b82f6' }, // Blue
                    type: 'COURSE_DATE',
                    details: {
                        description: "Fecha de inicio del curso"
                    }
                });
            }

            // Course End
            if (course.endDate) {
                events.push({
                    id: `course-end-${course.id}`,
                    title: course.title,
                    startAt: course.endDate,
                    endAt: course.endDate,
                    status: { name: 'Fin Curso', color: '#ef4444' }, // Red
                    type: 'COURSE_DATE',
                    details: {
                        description: "Fecha de finalización del curso"
                    }
                });
            }

            // Activities
            course.activities.forEach(activity => {
                const eventDate = activity.openDate || activity.deadline;
                const url = role === 'teacher'
                    ? `/dashboard/teacher/courses/${course.id}/activities/${activity.id}`
                    : `/dashboard/student/activities/${activity.id}`;

                events.push({
                    id: `activity-${activity.id}`,
                    title: activity.title,
                    startAt: eventDate,
                    endAt: eventDate,
                    status: { name: 'Actividad', color: '#22c55e' }, // Green
                    type: 'ACTIVITY',
                    details: {
                        courseName: course.title,
                        description: activity.description,
                        weight: activity.weight,
                        openDate: activity.openDate,
                        deadline: activity.deadline,
                        url: url,
                        activityType: activity.type // GITHUB or MANUAL
                    }
                });
            });
        });

        // Map Absences
        absences.forEach(absence => {
            const color = '#ef4444'; // Red for all Absences
            let title = 'Inasistencia';
            if (absence.status === 'LATE') {
                title = 'Llegada Tarde';
            } else if (absence.status === 'EXCUSED') {
                title = 'Excusado';
            }

            events.push({
                id: `absence-${absence.id}`,
                title: absence.course.title,
                startAt: absence.date,
                endAt: absence.date,
                status: { name: title, color: color },
                type: 'ABSENCE',
                details: {
                    courseName: absence.course.title,
                    status: absence.status,
                    justification: absence.justification,
                    justificationUrl: absence.justificationUrl,
                    arrivalTime: absence.arrivalTime
                }
            });
        });

        // Map Remarks
        remarks.forEach(remark => {
            const color = '#3b82f6'; // Blue for all Remarks
            const title = remark.type === 'ATTENTION' ? 'Atención' : 'Felicitación';

            events.push({
                id: `remark-${remark.id}`,
                title: remark.title,
                startAt: remark.date,
                endAt: remark.date,
                status: { name: title, color: color },
                type: 'REMARK',
                details: {
                    courseName: remark.course.title,
                    type: remark.type,
                    description: remark.description
                }
            });
        });

        return events;
    },

    async getStudentsForTeacher(teacherId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                course: { teacherId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            distinct: ['userId'],
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });

        return enrollments.map(e => e.user);
    },

    async getCourseGradesReport(courseId: string) {
        // 1. Fetch Course and Activities
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                activities: {
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!course) throw new Error("Course not found");

        // 2. Fetch Enrolled Students
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: courseId,
                status: 'APPROVED' // Only active students
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                identificacion: true,
                                nombres: true,
                                apellido: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                user: { name: 'asc' }
            }
        });

        // 3. Fetch All Submissions for this course
        const activityIds = course.activities.map(a => a.id);
        const submissions = await prisma.submission.findMany({
            where: {
                activityId: { in: activityIds }
            }
        });

        // 4. Process Data
        const reportData = enrollments.map(enrollment => {
            const student = enrollment.user;
            const row: any = {
                'ID': student.profile?.identificacion || student.id.substring(0, 8),
                'Estudiante': student.profile?.nombres && student.profile?.apellido
                    ? `${student.profile.nombres} ${student.profile.apellido}`
                    : student.name,
                'Correo': student.email
            };

            let totalWeightedGrade = 0;
            let totalWeight = 0;
            const now = new Date();

            course.activities.forEach(activity => {
                const submission = submissions.find(s => s.activityId === activity.id && s.userId === student.id);

                let grade = 0;
                let displayGrade = '-';

                if (submission && submission.grade !== null) {
                    grade = submission.grade;
                    displayGrade = grade.toFixed(1);
                    totalWeightedGrade += grade * activity.weight;
                    totalWeight += activity.weight;
                } else if (!submission && activity.deadline && activity.deadline < now && activity.type !== 'MANUAL') {
                    // Missed deadline => 0.0
                    grade = 0.0;
                    displayGrade = '0.0';
                    totalWeightedGrade += 0.0;
                    totalWeight += activity.weight;
                }

                row[activity.title] = displayGrade;
            });

            const average = totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;
            row['Nota Final'] = average.toFixed(1);

            return row;
        });

        return reportData;
    }
};
