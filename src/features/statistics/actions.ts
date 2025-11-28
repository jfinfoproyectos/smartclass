"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";


async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function getStatisticsData(courseId?: string, studentId?: string) {
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

    // 2. Fetch Students for Filter (belonging to teacher's courses)
    const students = await prisma.user.findMany({
        where: {
            enrollments: {
                some: {
                    course: { teacherId }
                }
            },
            role: "student"
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
        distinct: ['id']
    });

    // 3. Build Filters
    const whereCourse = courseId && courseId !== "all" ? { courseId } : { course: { teacherId } };
    const whereStudent = studentId && studentId !== "all" ? { userId: studentId } : {};

    // 4. Fetch Grades Data (Submissions)
    const submissions = await prisma.submission.findMany({
        where: {
            activity: {
                ...whereCourse
            },
            ...whereStudent,
            grade: { not: null }
        },
        include: {
            activity: { select: { title: true, courseId: true } },
            user: { select: { name: true } }
        },
        orderBy: { createdAt: 'asc' }
    });

    // 5. Fetch Attendance Data
    const attendance = await prisma.attendance.findMany({
        where: {
            ...whereCourse,
            ...whereStudent
        },
        orderBy: { date: 'asc' }
    });

    // 6. Fetch Observations (Remarks)
    const remarks = await prisma.remark.findMany({
        where: {
            ...whereCourse,
            ...whereStudent
        },
        orderBy: { date: 'asc' }
    });

    // --- Data Aggregation ---

    // A. Grades Over Time (Average per day/activity)
    const gradesMap = new Map<string, { date: string; total: number; count: number; activityName: string }>();

    submissions.forEach(sub => {
        const date = sub.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        // Group by date for simplicity in this view, or by activity
        if (!gradesMap.has(date)) {
            gradesMap.set(date, { date, total: 0, count: 0, activityName: sub.activity.title });
        }
        const entry = gradesMap.get(date)!;
        entry.total += sub.grade || 0;
        entry.count += 1;
    });

    const gradesOverTime = Array.from(gradesMap.values()).map(entry => ({
        date: entry.date,
        average: parseFloat((entry.total / entry.count).toFixed(2)),
        activity: entry.activityName
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    // B. Attendance Trends
    const attendanceMap = new Map<string, { date: string; present: number; absent: number; late: number; excused: number }>();

    attendance.forEach(att => {
        const date = att.date.toISOString().split('T')[0];
        if (!attendanceMap.has(date)) {
            attendanceMap.set(date, { date, present: 0, absent: 0, late: 0, excused: 0 });
        }
        const entry = attendanceMap.get(date)!;
        if (att.status === 'PRESENT') entry.present++;
        else if (att.status === 'ABSENT') entry.absent++;
        else if (att.status === 'LATE') entry.late++;
        else if (att.status === 'EXCUSED') entry.excused++;
    });

    const attendanceTrends = Array.from(attendanceMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // C. Observations Trends
    const remarksMap = new Map<string, { date: string; positive: number; negative: number }>();

    remarks.forEach(rem => {
        const date = rem.date.toISOString().split('T')[0];
        if (!remarksMap.has(date)) {
            remarksMap.set(date, { date, positive: 0, negative: 0 });
        }
        const entry = remarksMap.get(date)!;
        if (rem.type === 'COMMENDATION') entry.positive++;
        else if (rem.type === 'ATTENTION') entry.negative++;
    });

    const remarksTrends = Array.from(remarksMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // D. Grade Distribution (Pie Chart)
    const distribution = [
        { name: "Excelente (4.5 - 5.0)", value: 0, fill: "var(--chart-2)" },
        { name: "Bueno (4.0 - 4.49)", value: 0, fill: "var(--chart-1)" },
        { name: "Aceptable (3.0 - 3.99)", value: 0, fill: "var(--chart-4)" },
        { name: "Insuficiente (0.0 - 2.99)", value: 0, fill: "var(--destructive)" },
    ];

    if (studentId && studentId !== "all") {
        // Single Student: Distribution of Activity Grades
        submissions.forEach(sub => {
            const grade = sub.grade || 0;
            if (grade >= 4.5) distribution[0].value++;
            else if (grade >= 4.0) distribution[1].value++;
            else if (grade >= 3.0) distribution[2].value++;
            else distribution[3].value++;
        });
    } else {
        // All Students: Distribution of Student Averages
        const studentGrades = new Map<string, { total: number; count: number }>();
        submissions.forEach(sub => {
            if (!studentGrades.has(sub.userId)) {
                studentGrades.set(sub.userId, { total: 0, count: 0 });
            }
            const entry = studentGrades.get(sub.userId)!;
            entry.total += sub.grade || 0;
            entry.count += 1;
        });

        studentGrades.forEach(entry => {
            const average = entry.total / entry.count;
            if (average >= 4.5) distribution[0].value++;
            else if (average >= 4.0) distribution[1].value++;
            else if (average >= 3.0) distribution[2].value++;
            else distribution[3].value++;
        });
    }

    // E. Attendance by Month (Bar Chart - Multiple)
    const attendanceByMonthMap = new Map<string, { month: string; absent: number; late: number; excused: number }>();

    attendance.forEach(att => {
        const date = new Date(att.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const monthName = date.toLocaleString('es-ES', { month: 'long' });

        if (!attendanceByMonthMap.has(monthKey)) {
            attendanceByMonthMap.set(monthKey, {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                absent: 0,
                late: 0,
                excused: 0
            });
        }
        const entry = attendanceByMonthMap.get(monthKey)!;

        if (att.status === 'ABSENT') entry.absent++;
        else if (att.status === 'LATE') entry.late++;
        else if (att.status === 'EXCUSED') entry.excused++;
    });

    const attendanceByMonth = Array.from(attendanceByMonthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([_, value]) => value);

    return {
        courses,
        students,
        charts: {
            grades: gradesOverTime,
            attendance: attendanceTrends,
            remarks: remarksTrends,
            distribution,
            attendanceByMonth // Added attendanceByMonth
        }
    };
}
