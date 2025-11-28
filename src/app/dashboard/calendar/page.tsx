import { UnifiedCalendar } from "@/features/calendar/UnifiedCalendar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Calendario | EIA",
    description: "Calendario unificado de actividades y eventos",
};

export default function CalendarPage() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold">Calendario Unificado</h1>
            <p className="text-muted-foreground">
                Visualiza todas tus entregas y fechas importantes en un solo lugar.
            </p>
            <UnifiedCalendar />
        </div>
    );
}
