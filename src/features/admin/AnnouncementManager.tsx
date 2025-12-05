"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createAnnouncementAction, updateAnnouncementAction, deleteAnnouncementAction, getAnnouncementsAction } from "@/app/actions";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";

export function AnnouncementManager() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [content, setContent] = useState<string>("");
    const [type, setType] = useState<string>("INFO");
    const [showImage, setShowImage] = useState<boolean>(true);
    const [imagePosition, setImagePosition] = useState<string>("LEFT");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    useEffect(() => {
        loadAnnouncements();
    }, []);

    useEffect(() => {
        if (editingAnnouncement) {
            setContent(editingAnnouncement.content || "");
            setType(editingAnnouncement.type || "INFO");
            setShowImage(editingAnnouncement.showImage ?? true);
            setImagePosition(editingAnnouncement.imagePosition || "LEFT");

            // Convert Date objects to datetime-local format (YYYY-MM-DDTHH:mm)
            if (editingAnnouncement.startDate) {
                const date = new Date(editingAnnouncement.startDate);
                setStartDate(date.toISOString().slice(0, 16));
            } else {
                setStartDate("");
            }

            if (editingAnnouncement.endDate) {
                const date = new Date(editingAnnouncement.endDate);
                setEndDate(date.toISOString().slice(0, 16));
            } else {
                setEndDate("");
            }
        } else {
            setContent("");
            setType("INFO");
            setShowImage(true);
            setImagePosition("LEFT");
            setStartDate("");
            setEndDate("");
        }
    }, [editingAnnouncement]);

    const loadAnnouncements = async () => {
        const data = await getAnnouncementsAction();
        setAnnouncements(data);
    };

    const getTemporalStatus = (announcement: any) => {
        const now = new Date();
        const start = announcement.startDate ? new Date(announcement.startDate) : null;
        const end = announcement.endDate ? new Date(announcement.endDate) : null;

        if (start && start > now) {
            return { icon: "🕐", text: "Programado", color: "bg-blue-100 text-blue-800" };
        }
        if (end && end < now) {
            return { icon: "⏰", text: "Expirado", color: "bg-gray-100 text-gray-800" };
        }
        return { icon: "✅", text: "Activo", color: "bg-green-100 text-green-800" };
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Gestión de Anuncios</h3>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) setEditingAnnouncement(null);
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Anuncio</Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingAnnouncement ? "Editar Anuncio" : "Crear Anuncio"}</DialogTitle>
                            <DialogDescription>
                                Publica información importante para todos los usuarios.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            formData.append("content", content);
                            formData.append("type", type);
                            formData.append("showImage", showImage.toString());
                            formData.append("imagePosition", imagePosition);
                            if (startDate) formData.append("startDate", startDate);
                            if (endDate) formData.append("endDate", endDate);

                            if (editingAnnouncement) {
                                formData.append("id", editingAnnouncement.id);
                                await updateAnnouncementAction(formData);
                                toast.success("Anuncio actualizado");
                            } else {
                                await createAnnouncementAction(formData);
                                toast.success("Anuncio creado");
                            }
                            setIsOpen(false);
                            setEditingAnnouncement(null);
                            loadAnnouncements();
                        }} className="flex-1 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden p-1">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Título</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            defaultValue={editingAnnouncement?.title}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipo de Anuncio</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INFO">Información</SelectItem>
                                                <SelectItem value="URGENT">Urgente / Alerta</SelectItem>
                                                <SelectItem value="EVENT">Evento</SelectItem>
                                                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                                                <SelectItem value="SUCCESS">Éxito / Logro</SelectItem>
                                                <SelectItem value="WARNING">Advertencia</SelectItem>
                                                <SelectItem value="NEWSLETTER">Boletín</SelectItem>
                                                <SelectItem value="CELEBRATION">Celebración</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="imageUrl">URL de la Imagen (Opcional)</Label>
                                        <Input
                                            id="imageUrl"
                                            name="imageUrl"
                                            defaultValue={editingAnnouncement?.imageUrl}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="imagePosition">Posición de la Imagen</Label>
                                        <Select value={imagePosition} onValueChange={setImagePosition}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona posición" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LEFT">Izquierda</SelectItem>
                                                <SelectItem value="RIGHT">Derecha</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="showImage"
                                            checked={showImage}
                                            onCheckedChange={setShowImage}
                                        />
                                        <Label htmlFor="showImage">Mostrar Imagen</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="visible"
                                            name="visible"
                                            value="true"
                                            defaultChecked={editingAnnouncement?.visible ?? true}
                                        />
                                        <Label htmlFor="visible">Visible</Label>
                                    </div>
                                    <div className="space-y-2 pt-4">
                                        <Label htmlFor="startDate">Fecha de Inicio (Opcional)</Label>
                                        <Input
                                            id="startDate"
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">El anuncio solo se mostrará después de esta fecha</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                                        <Input
                                            id="endDate"
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">El anuncio se ocultará automáticamente después de esta fecha</p>
                                    </div>
                                </div>
                                <div className="space-y-2 h-full flex flex-col" data-color-mode="light">
                                    <Label htmlFor="content">Contenido</Label>
                                    <div className="flex-1 overflow-auto border rounded-md">
                                        <MDEditor
                                            value={content}
                                            onChange={(val) => setContent(val || "")}
                                            height="100%"
                                            preview="edit"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="submit">{editingAnnouncement ? "Actualizar" : "Publicar"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="w-full overflow-x-auto rounded-md border">
                <Table className="min-w-[900px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Contenido</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Programación</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {announcements.map((announcement) => (
                            <TableRow key={announcement.id}>
                                <TableCell className="font-medium">{announcement.title}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${announcement.type === 'URGENT' ? 'bg-red-100 text-red-800' :
                                            announcement.type === 'EVENT' ? 'bg-purple-100 text-purple-800' :
                                                announcement.type === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                                                    announcement.type === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                                        announcement.type === 'WARNING' ? 'bg-orange-100 text-orange-800' :
                                                            announcement.type === 'NEWSLETTER' ? 'bg-indigo-100 text-indigo-800' :
                                                                announcement.type === 'CELEBRATION' ? 'bg-pink-100 text-pink-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                        {announcement.type || 'INFO'}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-md truncate">{announcement.content}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${announcement.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {announcement.visible ? "Visible" : "Oculto"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const status = getTemporalStatus(announcement);
                                        return (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                                {status.icon} {status.text}
                                            </span>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>{new Date(announcement.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingAnnouncement(announcement);
                                                setIsOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <form action={async (formData) => {
                                            formData.append("id", announcement.id);
                                            await deleteAnnouncementAction(formData);
                                            toast.success("Anuncio eliminado");
                                            loadAnnouncements();
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {announcements.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay anuncios creados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
