"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GoogleSheetActivityDetailsProps {
    activity: any;
    userId: string;
    studentName: string;
}

export function GoogleSheetActivityDetails({ activity, userId, studentName }: GoogleSheetActivityDetailsProps) {
    return (
        <div className="space-y-6 w-full p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/student">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{activity.title}</h1>
                    <p className="text-muted-foreground">{activity.course.title}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Actividad de Google Sheets</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>La integración con Google Sheets estará disponible próximamente.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
