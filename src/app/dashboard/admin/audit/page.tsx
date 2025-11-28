import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuditLogPanel } from "@/features/admin/AuditLogPanel";

export default async function AuditLogsPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || session.user.role !== "admin") {
        redirect("/signin");
    }

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h1>
                <p className="text-muted-foreground">
                    Monitoreo completo de todas las operaciones del sistema
                </p>
            </div>

            <AuditLogPanel />
        </div>
    );
}
