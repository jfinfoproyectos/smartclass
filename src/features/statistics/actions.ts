"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { formatName } from "@/lib/utils";
import prisma from "@/lib/prisma";


async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function getStatisticsData(courseId?: string) {
    const session = await getSession();
    if (!session?.user || session.user.role !== "teacher") {
        throw new Error("Unauthorized");
    }

    const teacherId = session.user.id;

    // 1. Fetch Courses for Filter
    const courses = await prisma.course.findMany({
        where: { teacherId },
        select: { id: true, title: true },
        orderBy: { title: 'asc' }
    });

    if (courses.length === 0) {
        return null;
    }

    // Default to first course if no courseId provided or "all" (which shouldn't happen but safe to handle)
    const selectedCourseId = (!courseId || courseId === "all") ? courses[0].id : courseId;
    const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

    // 2. Fetch Students enrolled in the selected course
    const students = await prisma.user.findMany({
        where: {
            enrollments: {
                some: {
                    courseId: selectedCourseId
                }
            },
            role: "student"
        },
        select: { 
            id: true, 
            name: true, 
            email: true,
            profile: {
                select: {
                    nombres: true,
                    apellido: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // 3. Fetch Data for the selected course
    const [submissions, attendance, remarks, activities] = await Promise.all([
        // Submissions
        prisma.submission.findMany({
            where: {
                activity: { courseId: selectedCourseId },
                grade: { not: null }
            },
            include: {
                activity: { select: { id: true, title: true } },
                user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'asc' }
        }),
        // Attendance
        prisma.attendance.findMany({
            where: { courseId: selectedCourseId },
            orderBy: { date: 'asc' }
        }),
        // Remarks
        prisma.remark.findMany({
            where: { courseId: selectedCourseId },
            orderBy: { date: 'asc' }
        }),
        // Activities (to calculate completion)
        prisma.activity.findMany({
            where: { courseId: selectedCourseId },
            select: { id: true, title: true }
        })
    ]);

    // --- Data Aggregation ---
    
    // Index data by userId for O(n) lookup
    const submissionsByUser = new Map<string, typeof submissions>();
    const attendanceByUser = new Map<string, typeof attendance>();
    const remarksByUser = new Map<string, typeof remarks>();

    submissions.forEach(s => {
        if (!submissionsByUser.has(s.userId)) submissionsByUser.set(s.userId, []);
        submissionsByUser.get(s.userId)!.push(s);
    });

    attendance.forEach(a => {
        if (!attendanceByUser.has(a.userId)) attendanceByUser.set(a.userId, []);
        attendanceByUser.get(a.userId)!.push(a);
    });

    remarks.forEach(r => {
        if (!remarksByUser.has(r.userId)) remarksByUser.set(r.userId, []);
        remarksByUser.get(r.userId)!.push(r);
    });

    // A. Student Metrics
    const studentMetrics = students.map(student => {
        const studentSubmissions = submissionsByUser.get(student.id) || [];
        const studentAttendance = attendanceByUser.get(student.id) || [];
        const studentRemarks = remarksByUser.get(student.id) || [];

        // Average Grade
        const totalGrade = studentSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0);
        const averageGrade = studentSubmissions.length > 0 ? totalGrade / studentSubmissions.length : 0;

        // Attendance %
        const totalSessions = studentAttendance.length;
        // Late and Excused also count as attended in this context
        const attendedSessions = studentAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EXCUSED').length;
        const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

        // Missing Activities
        const submittedActivityIds = new Set(studentSubmissions.map(s => s.activityId));
        const missingActivities = activities.length - submittedActivityIds.size;

        return {
            id: student.id,
            name: formatName(student.name, student.profile),
            email: student.email,
            averageGrade: parseFloat(averageGrade.toFixed(2)),
            attendancePercentage: parseFloat(attendancePercentage.toFixed(1)),
            missingActivities: Math.max(0, missingActivities),
            remarksCount: studentRemarks.length
        };
    }).sort((a, b) => b.averageGrade - a.averageGrade);

    // B. Activity Performance (Average grade per activity)
    const activityPerformanceMap = new Map<string, { title: string; total: number; count: number }>();
    submissions.forEach(sub => {
        if (!activityPerformanceMap.has(sub.activityId)) {
            activityPerformanceMap.set(sub.activityId, { title: sub.activity.title, total: 0, count: 0 });
        }
        const entry = activityPerformanceMap.get(sub.activityId)!;
        entry.total += sub.grade || 0;
        entry.count += 1;
    });

    const activityPerformance = Array.from(activityPerformanceMap.values()).map(entry => ({
        activity: entry.title,
        average: parseFloat((entry.total / entry.count).toFixed(2))
    })).sort((a, b) => a.average - b.average); // Sort by difficulty (lowest average first)

    // C. Grade Distribution (Pie Chart)
    const distribution = [
        { name: "Excelente (4.5 - 5.0)", value: 0, fill: "var(--chart-2)" },
        { name: "Bueno (4.0 - 4.49)", value: 0, fill: "var(--chart-1)" },
        { name: "Aceptable (3.0 - 3.99)", value: 0, fill: "var(--chart-4)" },
        { name: "Insuficiente (0.0 - 2.99)", value: 0, fill: "var(--destructive)" },
    ];

    studentMetrics.forEach(student => {
        const avg = student.averageGrade;
        if (avg >= 4.5) distribution[0].value++;
        else if (avg >= 4.0) distribution[1].value++;
        else if (avg >= 3.0) distribution[2].value++;
        else distribution[3].value++;
    });

    // D. Attendance Trends (Line Chart)
    const attendanceMap = new Map<string, { date: string; present: number; total: number }>();
    attendance.forEach(att => {
        const date = att.date.toISOString().split('T')[0];
        if (!attendanceMap.has(date)) {
            attendanceMap.set(date, { date, present: 0, total: 0 });
        }
        const entry = attendanceMap.get(date)!;
        entry.total++;
        if (att.status === 'PRESENT' || att.status === 'LATE') entry.present++;
    });

    const attendanceTrends = Array.from(attendanceMap.values())
        .map(entry => ({
            date: entry.date,
            percentage: parseFloat(((entry.present / entry.total) * 100).toFixed(1))
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        courses,
        selectedCourseId,
        studentMetrics,
        charts: {
            activityPerformance,
            distribution,
            attendanceTrends
        }
    };
}
