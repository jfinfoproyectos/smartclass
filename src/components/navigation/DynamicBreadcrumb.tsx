"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { getCourseTitle, getActivityTitle } from "@/app/actions/breadcrumb-actions";

interface BreadcrumbSegment {
    label: string;
    href?: string;
}

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = pathname.split("/").filter(Boolean);
            const breadcrumbs: BreadcrumbSegment[] = [];

            // Always start with Dashboard
            breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });

            // Process path segments
            for (let i = 1; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const isLast = i === pathSegments.length - 1;

                // Role segments: skip them UNLESS they are the last segment (the dashboard root for that role)
                const roleSegments = ["teacher", "student", "admin"];
                if (roleSegments.includes(segment) && !isLast) {
                    continue;
                }

                // Map segment names to readable labels
                const segmentMap: Record<string, string> = {
                    teacher: "Cursos", // Teacher dashboard shows courses
                    student: "Cursos", // Student dashboard shows courses
                    admin: "Administración",
                    courses: "Cursos",
                    activities: "Actividades",
                    notifications: "Notificaciones",
                    attendance: "Asistencia",
                    schedule: "Horario",
                    statistics: "Estadísticas",
                    duplicates: "Reporte de Duplicados",
                    calendar: "Calendario",
                };

                // Check if it's a UUID or ID (course/activity detail)
                const isId = segment.match(/^[a-f0-9-]{36}$/) || (!segmentMap[segment] && segment.match(/^[a-z0-9]+$/i));

                if (isId) {
                    // For IDs, we'll try to fetch the name
                    const prevSegment = pathSegments[i - 1];

                    if (prevSegment === "courses") {
                        // Fetch course name
                        const courseTitle = await getCourseTitle(segment);
                        breadcrumbs.push({
                            label: courseTitle || "Curso",
                            href: isLast ? undefined : `/dashboard/${pathSegments.slice(1, i + 1).join("/")}`,
                        });
                    } else if (prevSegment === "activities") {
                        // Fetch activity name
                        const activityTitle = await getActivityTitle(segment);
                        breadcrumbs.push({
                            label: activityTitle || "Actividad",
                            href: isLast ? undefined : `/dashboard/${pathSegments.slice(1, i + 1).join("/")}`,
                        });
                    } else {
                        // Generic ID
                        breadcrumbs.push({
                            label: segment,
                            href: isLast ? undefined : `/dashboard/${pathSegments.slice(1, i + 1).join("/")}`,
                        });
                    }
                } else {
                    const label = segmentMap[segment] || segment;
                    breadcrumbs.push({
                        label,
                        href: isLast ? undefined : `/dashboard/${pathSegments.slice(1, i + 1).join("/")}`,
                    });
                }
            }

            setSegments(breadcrumbs);
        };

        generateBreadcrumbs();
    }, [pathname]);

    // Don't show breadcrumbs on the main dashboard page
    if (pathname === "/dashboard") {
        return null;
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {segments.map((segment, index) => (
                    <div key={index} className="flex items-center">
                        <BreadcrumbItem>
                            {segment.href ? (
                                <BreadcrumbLink asChild>
                                    <Link href={segment.href}>{segment.label}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {index < segments.length - 1 && <BreadcrumbSeparator />}
                    </div>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
