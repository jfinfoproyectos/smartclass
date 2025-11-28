"use client";

import { GithubActivityDetails } from "./components/GithubActivityDetails";
import { ManualActivityDetails } from "./components/ManualActivityDetails";

import { GoogleColabActivityDetails } from "./components/GoogleColabActivityDetails";

interface ActivityDetailsProps {
    activity: any;
    userId: string;
    studentName: string;
}

export function ActivityDetails({ activity, userId, studentName }: ActivityDetailsProps) {
    switch (activity.type) {
        case "GITHUB":
            return <GithubActivityDetails activity={activity} userId={userId} studentName={studentName} />;
        case "GOOGLE_COLAB":
            return <GoogleColabActivityDetails activity={activity} userId={userId} studentName={studentName} />;
        case "MANUAL":
            return <ManualActivityDetails activity={activity} userId={userId} studentName={studentName} />;
        default:
            return <div>Tipo de actividad no soportado</div>;
    }
}
