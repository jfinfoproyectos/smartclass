import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentDashboard } from "@/features/student/StudentDashboard";
import { courseService } from "@/services/courseService";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "student") {
    redirect("/signin");
  }

  const availableCourses = await courseService.getAllCourses();
  const myEnrollments = await courseService.getStudentEnrollments(session.user.id);

  return <StudentDashboard availableCourses={availableCourses} myEnrollments={myEnrollments} studentName={session.user.name} />;
}
