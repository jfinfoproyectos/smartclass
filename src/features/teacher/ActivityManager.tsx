"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createActivityAction, updateActivityAction, deleteActivityAction } from "@/app/actions";
import { Plus, Calendar, FileText, MessageSquare, Pencil, Trash2, Eye, X, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";


import { scanRepositoryAction } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";

function FilePathInput({ name, defaultValue = "", placeholder }: { name: string, defaultValue?: string, placeholder?: string }) {
    const [paths, setPaths] = useState<string[]>(defaultValue ? defaultValue.split(",").map(p => p.trim()).filter(Boolean) : []);
    const [currentPath, setCurrentPath] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scannedFiles, setScannedFiles] = useState<string[]>([]);
    const [showScanner, setShowScanner] = useState(false);

    const addPath = () => {
        if (currentPath.trim() && !paths.includes(currentPath.trim())) {
            setPaths([...paths, currentPath.trim()]);
            setCurrentPath("");
        }
    };

    const removePath = (index: number) => {
        setPaths(paths.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPath();
        }
    };

    const handleScan = async () => {
        if (!repoUrl) return;
        setIsScanning(true);
        try {
            const files = await scanRepositoryAction(repoUrl);
            setScannedFiles(files);
        } catch (error) {
            console.error("Error scanning repo:", error);
            // You might want to show a toast here
        } finally {
            setIsScanning(false);
        }
    };

    const toggleScannedFile = (file: string) => {
        if (paths.includes(file)) {
            setPaths(paths.filter(p => p !== file));
        } else {
            setPaths([...paths, file]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    value={currentPath}
                    onChange={(e) => setCurrentPath(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button type="button" onClick={addPath} variant="secondary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Escanear Repositorio (Opcional)</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScanner(!showScanner)}
                        className="h-auto py-1 text-xs"
                    >
                        {showScanner ? "Ocultar Escáner" : "Mostrar Escáner"}
                    </Button>
                </div>

                {showScanner && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <Input
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/usuario/repositorio"
                                className="flex-1 text-sm"
                            />
                            <Button type="button" onClick={handleScan} disabled={isScanning || !repoUrl} size="sm">
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2">Escanear</span>
                            </Button>
                        </div>

                        {scannedFiles.length > 0 && (
                            <ScrollArea className="h-48 border rounded-md p-2">
                                <div className="space-y-1">
                                    {scannedFiles.map((file) => (
                                        <div key={file} className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded">
                                            <Checkbox
                                                id={`file-${file}`}
                                                checked={paths.includes(file)}
                                                onCheckedChange={() => toggleScannedFile(file)}
                                            />
                                            <Label htmlFor={`file-${file}`} className="text-xs font-mono cursor-pointer flex-1">
                                                {file}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                )}
            </div>

            {paths.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Archivos seleccionados:</Label>
                        <Badge variant="outline" className="text-xs">
                            {paths.length} {paths.length === 1 ? 'archivo' : 'archivos'}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {paths.map((path, index) => (
                            <Badge key={index} variant="secondary" className="font-mono text-xs flex items-center gap-1 pr-1">
                                {path}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 hover:bg-transparent hover:text-destructive rounded-full"
                                    onClick={() => removePath(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <input type="hidden" name={name} value={paths.join(",")} />
        </div>
    );
}



import { format } from "date-fns";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from "next-themes";

export function ActivityManager({ courseId, activities }: { courseId: string; activities: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string>("GITHUB");
    const [description, setDescription] = useState("**Instrucciones de la actividad**\n\n...");
    const [statement, setStatement] = useState("**Enunciado de la actividad**\n\n...");
    const { resolvedTheme } = useTheme();
    const mode = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto";
    const [isReordering, setIsReordering] = useState(false);

    const handleReorder = async (direction: 'up' | 'down', index: number) => {
        if (isReordering) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === activities.length - 1) return;

        setIsReordering(true);
        const newActivities = [...activities];
        const temp = newActivities[index];
        newActivities[index] = newActivities[direction === 'up' ? index - 1 : index + 1];
        newActivities[direction === 'up' ? index - 1 : index + 1] = temp;

        const activityIds = newActivities.map(a => a.id);

        try {
            await import("@/app/actions").then(mod => mod.reorderActivitiesAction(courseId, activityIds));
        } catch (error) {
            console.error("Failed to reorder", error);
        } finally {
            setIsReordering(false);
        }
    };

    const totalWeight = activities.reduce((sum, act) => sum + act.weight, 0);
    const isWeightBalanced = Math.abs(totalWeight - 100) < 0.1; // Tolerance for float errors

    return (
        <div className="space-y-4">
            {!isWeightBalanced && activities.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>
                            <strong>Advertencia:</strong> La suma de los pesos es {totalWeight.toFixed(1)}% (debe ser 100%).
                        </span>
                    </div>
                    <form action={async () => {
                        await import("@/app/actions").then(mod => mod.redistributeWeightsAction(courseId));
                    }}>
                        <Button type="submit" variant="outline" size="sm" className="bg-white dark:bg-amber-900 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100">
                            Redistribuir Pesos Automáticamente
                        </Button>
                    </form>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Actividades del Curso</h3>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nueva Actividad</Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-screen max-w-none sm:max-w-none p-0">
                        <form action={async (formData) => {
                            await createActivityAction(formData);
                            setIsOpen(false);
                            setDescription("**Instrucciones de la actividad**\n\n..."); // Reset
                            setStatement("**Enunciado de la actividad**\n\n..."); // Reset
                        }} className="flex flex-col h-full">
                            <input type="hidden" name="courseId" value={courseId} />
                            <input type="hidden" name="description" value={description} />
                            <input type="hidden" name="statement" value={statement} />
                            <SheetHeader className="px-6 py-4 border-b">
                                <SheetTitle>Crear Nueva Actividad</SheetTitle>
                                <SheetDescription>
                                    Configura los detalles y el contenido de la actividad.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                                    {/* Left Column: Metadata */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Título</Label>
                                            <Input id="title" name="title" required placeholder="Ej: Taller de React" />
                                        </div>

                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-6 space-y-2">
                                                <Label htmlFor="type">Tipo</Label>
                                                <Select name="type" defaultValue="GITHUB" onValueChange={setSelectedType}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GITHUB">GitHub Repositorio</SelectItem>
                                                        <SelectItem value="MANUAL">Manual</SelectItem>
                                                        <SelectItem value="GOOGLE_COLAB">Google Colab</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <Label htmlFor="weight">Peso (%)</Label>
                                                <Input id="weight" name="weight" type="number" step="1" min="1" max="100" defaultValue="1.0" required />
                                            </div>
                                            {selectedType !== "MANUAL" && (
                                                <div className="col-span-3 space-y-2">
                                                    <Label htmlFor="maxAttempts">Intentos</Label>
                                                    <Input id="maxAttempts" name="maxAttempts" type="number" min="1" max="3" defaultValue="1" required />
                                                </div>
                                            )}
                                        </div>

                                        {selectedType === "GITHUB" && (
                                            <div className="space-y-2">
                                                <Label>Archivos a evaluar (GitHub)</Label>
                                                <FilePathInput name="filePaths" placeholder="src/index.ts" />
                                                <p className="text-xs text-muted-foreground">Agrega las rutas de los archivos individualmente. Sin límite de archivos.</p>
                                            </div>
                                        )}

                                        {selectedType === "MANUAL" && (
                                            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox id="allowLinkSubmission" name="allowLinkSubmission" value="true" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="allowLinkSubmission" className="font-medium cursor-pointer">
                                                            Permitir envío de enlaces
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Los estudiantes podrán enviar enlaces (Google Drive, OneDrive, etc.) para esta actividad.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}


                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="openDate">Fecha de Apertura</Label>
                                                <Input id="openDate" name="openDate" type="datetime-local" />
                                            </div>
                                            {selectedType !== "MANUAL" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="deadline">Fecha Límite</Label>
                                                    <Input id="deadline" name="deadline" type="datetime-local" required />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Editor */}
                                    <div className="lg:col-span-8 flex flex-col h-full min-h-[500px] gap-4">
                                        {selectedType !== "MANUAL" && (
                                            <div className="flex-1 flex flex-col min-h-[300px]">
                                                <Label className="mb-2">Instrucciones (Informativas)</Label>
                                                <div className="flex-1 border rounded-md overflow-hidden" data-color-mode={mode}>
                                                    <MDEditor
                                                        value={description}
                                                        onChange={(val) => setDescription(val || "")}
                                                        height="100%"
                                                        preview="live"
                                                        className="h-full border-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col min-h-[300px]">
                                            <Label className="mb-2">Enunciado / Rúbrica de Evaluación</Label>
                                            <div className="flex-1 border rounded-md overflow-hidden" data-color-mode={mode}>
                                                <MDEditor
                                                    value={statement}
                                                    onChange={(val) => setStatement(val || "")}
                                                    height="100%"
                                                    preview="live"
                                                    className="h-full border-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="px-6 py-4 border-t bg-muted/50">
                                <Button type="submit" size="lg" className="w-full sm:w-auto">Guardar Actividad</Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="w-full overflow-x-auto rounded-md border">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Orden</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Peso</TableHead>
                            <TableHead>Fecha Límite</TableHead>
                            <TableHead>Entregas</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.map((activity, index) => (
                            <TableRow key={activity.id}>
                                <TableCell>
                                    <div className="flex flex-col gap-1">

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            disabled={index === 0 || isReordering}
                                            onClick={() => handleReorder('up', index)}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            disabled={index === activities.length - 1 || isReordering}
                                            onClick={() => handleReorder('down', index)}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div >
                                </TableCell >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex items-center">
                                            {activity.title}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{activity.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    {activity.weight.toFixed(1)}%
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-3 w-3" />
                                        {activity.type === "MANUAL" ? "-" : format(new Date(activity.deadline), "PP p")}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {activity.type === "MANUAL" ? "-" : `${activity.submissions.length} entregas`}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/teacher/courses/${courseId}/activities/${activity.id}`}>
                                            <Button variant="ghost" size="icon" title="Ver Entregas">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        <EditActivityDialog activity={activity} courseId={courseId} mode={mode} />

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Eliminar">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <form action={async (formData) => {
                                                    await deleteActivityAction(formData);
                                                }}>
                                                    <input type="hidden" name="courseId" value={courseId} />
                                                    <input type="hidden" name="activityId" value={activity.id} />
                                                    <DialogHeader>
                                                        <DialogTitle>Confirmar eliminación</DialogTitle>
                                                        <DialogDescription>
                                                            Escribe <strong>ELIMINAR</strong> para confirmar.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-4 items-center gap-4 py-4">
                                                        <Label htmlFor={`confirm-${activity.id}`} className="text-right">Confirmación</Label>
                                                        <Input id={`confirm-${activity.id}`} name="confirmText" placeholder="ELIMINAR" pattern="^ELIMINAR$" required className="col-span-3" />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" variant="destructive">Confirmar eliminación</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                            </TableRow >
                        ))}
                        {
                            activities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No hay actividades creadas para este curso.
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody >
                </Table >
            </div >
        </div >
    );
}

function EditActivityDialog({ activity, courseId, mode }: { activity: any, courseId: string, mode: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState(activity.description || "");
    const [statement, setStatement] = useState(activity.statement || "");
    const [selectedType, setSelectedType] = useState(activity.type);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Editar">
                    <Pencil className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-screen max-w-none sm:max-w-none p-0">
                <form action={async (formData) => {
                    await updateActivityAction(formData);
                    setIsOpen(false);
                }} className="flex flex-col h-full">
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="activityId" value={activity.id} />
                    <input type="hidden" name="description" value={description} />
                    <input type="hidden" name="statement" value={statement} />
                    <SheetHeader className="px-6 py-4 border-b">
                        <SheetTitle>Editar Actividad</SheetTitle>
                        <SheetDescription>Actualiza los detalles y el contenido.</SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                            {/* Left Column: Metadata */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${activity.id}`}>Título</Label>
                                    <Input id={`title-${activity.id}`} name="title" defaultValue={activity.title} required />
                                </div>


                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-6 space-y-2">
                                        <Label htmlFor={`type-${activity.id}`}>Tipo</Label>
                                        <Select name="type" defaultValue={activity.type} onValueChange={setSelectedType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona el tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GITHUB">GitHub Repositorio</SelectItem>
                                                <SelectItem value="MANUAL">Manual</SelectItem>
                                                <SelectItem value="GOOGLE_COLAB">Google Colab</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <Label htmlFor={`weight-${activity.id}`}>Peso (%)</Label>
                                        <Input id={`weight-${activity.id}`} name="weight" type="number" step="1" min="1" max="100" defaultValue={activity.weight.toFixed(1)} required />
                                    </div>
                                    {selectedType !== "MANUAL" && (
                                        <div className="col-span-3 space-y-2">
                                            <Label htmlFor={`maxAttempts-${activity.id}`}>Intentos</Label>
                                            <Input id={`maxAttempts-${activity.id}`} name="maxAttempts" type="number" min="1" max="3" defaultValue={activity.maxAttempts || 1} required />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`filePaths-${activity.id}`}>
                                        {selectedType === "GITHUB" ? "Archivos a evaluar (GitHub)" :
                                            "Configuración"}
                                    </Label>

                                    {selectedType === "GITHUB" && (
                                        <>
                                            <FilePathInput name="filePaths" defaultValue={activity.filePaths || ""} placeholder="src/index.ts" />
                                            <p className="text-xs text-muted-foreground">Agrega las rutas de los archivos individualmente. Sin límite de archivos.</p>
                                        </>
                                    )}



                                    {selectedType === "MANUAL" && (
                                        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                                            <div className="flex items-start space-x-3">
                                                <Checkbox
                                                    id={`allowLinkSubmission-${activity.id}`}
                                                    name="allowLinkSubmission"
                                                    value="true"
                                                    defaultChecked={activity.allowLinkSubmission || false}
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor={`allowLinkSubmission-${activity.id}`} className="font-medium cursor-pointer">
                                                        Permitir envío de enlaces
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Los estudiantes podrán enviar enlaces (Google Drive, OneDrive, etc.) para esta actividad.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`openDate-${activity.id}`}>Fecha de Apertura</Label>
                                        <Input
                                            id={`openDate-${activity.id}`}
                                            name="openDate"
                                            type="datetime-local"
                                            defaultValue={activity.openDate ? new Date(activity.openDate).toISOString().slice(0, 16) : ""}
                                        />
                                    </div>
                                    {selectedType !== "MANUAL" && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`deadline-${activity.id}`}>Fecha Límite</Label>
                                            <Input id={`deadline-${activity.id}`} name="deadline" type="datetime-local" defaultValue={new Date(activity.deadline).toISOString().slice(0, 16)} required />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Editor */}
                            <div className="lg:col-span-8 flex flex-col h-full min-h-[500px] gap-4">
                                {selectedType !== "MANUAL" && (
                                    <div className="flex-1 flex flex-col min-h-[300px]">
                                        <Label className="mb-2">Instrucciones (Informativas)</Label>
                                        <div className="flex-1 border rounded-md overflow-hidden" data-color-mode={mode}>
                                            <MDEditor
                                                value={description}
                                                onChange={(val) => setDescription(val || "")}
                                                height="100%"
                                                preview="live"
                                                className="h-full border-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col min-h-[300px]">
                                    <Label className="mb-2">Enunciado / Rúbrica de Evaluación</Label>
                                    <div className="flex-1 border rounded-md overflow-hidden" data-color-mode={mode}>
                                        <MDEditor
                                            value={statement}
                                            onChange={(val) => setStatement(val || "")}
                                            height="100%"
                                            preview="live"
                                            className="h-full border-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="px-6 py-4 border-t bg-muted/50">
                        <Button type="submit" size="lg" className="w-full sm:w-auto">Guardar Cambios</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
