"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Show back button when in course detail or activity detail pages
  const shouldShowBackButton = () => {
    // Teacher course detail: /dashboard/teacher/courses/[courseId]
    // Teacher activity detail: /dashboard/teacher/courses/[courseId]/activities/[activityId]
    // Student activity detail: /dashboard/student/activities/[id]
    // Duplicates report: /dashboard/teacher/courses/[courseId]/duplicates
    
    const isTeacherCourse = pathname.match(/^\/dashboard\/teacher\/courses\/[^/]+$/);
    const isTeacherActivity = pathname.match(/^\/dashboard\/teacher\/courses\/[^/]+\/activities\/[^/]+$/);
    const isStudentActivity = pathname.match(/^\/dashboard\/student\/activities\/[^/]+$/);
    const isDuplicatesReport = pathname.match(/^\/dashboard\/teacher\/courses\/[^/]+\/duplicates$/);
    
    return !!(isTeacherCourse || isTeacherActivity || isStudentActivity || isDuplicatesReport);
  };

  const handleBack = () => {
    router.back();
  };

  if (!shouldShowBackButton()) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="h-8 px-2 text-xs"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Regresar
    </Button>
  );
}
