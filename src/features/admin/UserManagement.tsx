"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Search, Trash2, Eye, UserCog, Users as UsersIcon, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { updateUserRoleAction, deleteUserAction, createUserAction, toggleUserBanAction, getAllUsersAction } from "@/app/admin-actions";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/user-avatar";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    image: string | null;
    createdAt: Date;
    banned?: boolean | null;
    profile?: {
        identificacion: string | null;
        nombres: string | null;
        apellido: string | null;
        telefono: string | null;
    } | null;
    _count?: {
        coursesCreated: number;
        enrollments: number;
        submissions: number;
    };
}

interface UserManagementProps {
    initialUsers: User[];
    totalCount: number;
}

export function UserManagement({ initialUsers, totalCount }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Create user form state
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserRole, setNewUserRole] = useState<"teacher" | "admin">("teacher");
    const [newUserPassword, setNewUserPassword] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingPage, setIsLoadingPage] = useState(false);
    const usersPerPage = 20;
    const totalPages = Math.ceil(totalCount / usersPerPage);

    // Role change confirmation state
    const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: "teacher" | "student" | "admin"; userName: string } | null>(null);
    const [roleChangeConfirmation, setRoleChangeConfirmation] = useState("");

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || isLoadingPage) return;

        setIsLoadingPage(true);
        try {
            const offset = (newPage - 1) * usersPerPage;
            const { users: newUsers } = await getAllUsersAction({
                limit: usersPerPage,
                offset,
                role: roleFilter !== "all" ? roleFilter as any : undefined,
                search: searchQuery || undefined
            });
            setUsers(newUsers);
            setCurrentPage(newPage);
        } catch (error) {
            toast.error("Error al cargar usuarios");
        } finally {
            setIsLoadingPage(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: "teacher" | "student" | "admin") => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Open confirmation dialog
        setPendingRoleChange({ userId, newRole, userName: user.name || user.email });
        setRoleChangeDialogOpen(true);
    };

    const confirmRoleChange = async () => {
        if (!pendingRoleChange || roleChangeConfirmation !== "cambiar") return;

        startTransition(async () => {
            try {
                await updateUserRoleAction(pendingRoleChange.userId, pendingRoleChange.newRole);

                setUsers(prev => prev.map(u =>
                    u.id === pendingRoleChange.userId ? { ...u, role: pendingRoleChange.newRole } : u
                ));

                toast.success("Rol actualizado", {
                    description: `El rol del usuario ha sido cambiado a ${pendingRoleChange.newRole}`
                });

                // Reset dialog state
                setRoleChangeDialogOpen(false);
                setPendingRoleChange(null);
                setRoleChangeConfirmation("");
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo actualizar el rol"
                });
            }
        });
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        startTransition(async () => {
            try {
                await deleteUserAction(userToDelete.id);

                setUsers(prev => prev.filter(u => u.id !== userToDelete.id));

                toast.success("Usuario eliminado", {
                    description: "El usuario ha sido eliminado del sistema"
                });

                setDeleteDialogOpen(false);
                setUserToDelete(null);
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo eliminar el usuario"
                });
            }
        });
    };

    const handleToggleBan = async (userId: string, currentBanned: boolean) => {
        startTransition(async () => {
            try {
                await toggleUserBanAction(userId, !currentBanned);

                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, banned: !currentBanned } : u
                ));

                toast.success(!currentBanned ? "Usuario baneado" : "Usuario desbaneado", {
                    description: `El usuario ha sido ${!currentBanned ? 'baneado' : 'desbaneado'} exitosamente`
                });
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo actualizar el estado del usuario"
                });
            }
        });
    };

    const getRoleBadgeVariant = (role: string | null) => {
        switch (role) {
            case "admin":
                return "destructive";
            case "teacher":
                return "default";
            case "student":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getRoleLabel = (role: string | null) => {
        switch (role) {
            case "admin":
                return "Administrador";
            case "teacher":
                return "Profesor";
            case "student":
                return "Estudiante";
            default:
                return role || "Sin rol";
        }
    };

    const handleCreateUser = async () => {
        if (!newUserEmail || !newUserName || !newUserPassword) {
            toast.error("Error", {
                description: "Todos los campos son obligatorios"
            });
            return;
        }

        startTransition(async () => {
            try {
                const user = await createUserAction({
                    email: newUserEmail,
                    name: newUserName,
                    role: newUserRole,
                    password: newUserPassword
                });

                setUsers(prev => [{
                    ...user,
                    role: user.role as string,
                    createdAt: new Date(user.createdAt),
                    profile: null,
                    _count: {
                        coursesCreated: 0,
                        enrollments: 0,
                        submissions: 0
                    }
                }, ...prev]);

                toast.success("Usuario creado", {
                    description: `Se ha creado el usuario ${user.name}`
                });

                // Reset form
                setNewUserEmail("");
                setNewUserName("");
                setNewUserRole("teacher");
                setNewUserPassword("");
                setCreateDialogOpen(false);
            } catch (error: any) {
                toast.error("Error", {
                    description: error.message || "No se pudo crear el usuario"
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">
                        Administra todos los usuarios del sistema
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <Badge variant="outline" className="text-sm">
                        <UsersIcon className="mr-2 h-3 w-3" />
                        {totalCount} usuarios totales
                    </Badge>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear Usuario
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>Busca y filtra usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filtrar por rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los roles</SelectItem>
                                <SelectItem value="admin">Administradores</SelectItem>
                                <SelectItem value="teacher">Profesores</SelectItem>
                                <SelectItem value="student">Estudiantes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
                    <CardDescription>
                        Lista de todos los usuarios registrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto rounded-md border">
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="hidden lg:table-cell">Estado</TableHead>
                                    <TableHead className="hidden xl:table-cell">Estadísticas</TableHead>
                                    <TableHead className="hidden sm:table-cell">Fecha Registro</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No se encontraron usuarios
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar
                                                        src={user.image}
                                                        alt={user.name || "User"}
                                                        fallbackText={user.name || user.email}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{user.name || "Sin nombre"}</div>
                                                        {user.profile && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {user.profile.identificacion}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role || "student"}
                                                    onValueChange={(value) => handleRoleChange(user.id, value as any)}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                                            {getRoleLabel(user.role)}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="student">Estudiante</SelectItem>
                                                        <SelectItem value="teacher">Profesor</SelectItem>
                                                        <SelectItem value="admin">Administrador</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={!user.banned}
                                                        onCheckedChange={() => handleToggleBan(user.id, user.banned || false)}
                                                        disabled={isPending}
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        {user.banned ? "Baneado" : "Activo"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                {user._count && (
                                                    <div className="text-xs space-y-1">
                                                        {user.role === "teacher" && (
                                                            <div>{user._count.coursesCreated} cursos</div>
                                                        )}
                                                        {user.role === "student" && (
                                                            <>
                                                                <div>{user._count.enrollments} inscripciones</div>
                                                                <div>{user._count.submissions} entregas</div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                                {format(new Date(user.createdAt), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setDetailsSheetOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setUserToDelete(user);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        disabled={isPending}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                Mostrando {((currentPage - 1) * usersPerPage) + 1} - {Math.min(currentPage * usersPerPage, totalCount)} de {totalCount} usuarios
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoadingPage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Anterior</span>
                                </Button>
                                <div className="text-xs sm:text-sm whitespace-nowrap">
                                    Página {currentPage} de {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || isLoadingPage}
                                >
                                    <span className="hidden sm:inline">Siguiente</span>
                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
                            {userToDelete && ` "${userToDelete.name || userToDelete.email}"`} y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Role Change Confirmation Dialog */}
            <Dialog open={roleChangeDialogOpen} onOpenChange={(open) => {
                setRoleChangeDialogOpen(open);
                if (!open) {
                    setPendingRoleChange(null);
                    setRoleChangeConfirmation("");
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Cambiar rol de usuario?</DialogTitle>
                        <DialogDescription>
                            Estás a punto de cambiar el rol de <strong>{pendingRoleChange?.userName}</strong> a{" "}
                            <strong>{pendingRoleChange?.newRole === "admin" ? "Administrador" : pendingRoleChange?.newRole === "teacher" ? "Profesor" : "Estudiante"}</strong>.
                            <br /><br />
                            Esta acción puede afectar los permisos y accesos del usuario en el sistema.
                            <br /><br />
                            Escribe <strong>cambiar</strong> para confirmar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            placeholder="Escribe cambiar"
                            value={roleChangeConfirmation}
                            onChange={(e) => setRoleChangeConfirmation(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRoleChangeDialogOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmRoleChange}
                            disabled={isPending || roleChangeConfirmation !== "cambiar"}
                        >
                            {isPending ? "Cambiando..." : "Cambiar Rol"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Details Sheet */}
            <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Detalles del Usuario</SheetTitle>
                        <SheetDescription>
                            Información completa del usuario
                        </SheetDescription>
                    </SheetHeader>
                    {selectedUser && (
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <UserAvatar
                                    src={selectedUser.image}
                                    alt={selectedUser.name || "User"}
                                    fallbackText={selectedUser.name || selectedUser.email}
                                    size="lg"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.name || "Sin nombre"}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-1">
                                        {getRoleLabel(selectedUser.role)}
                                    </Badge>
                                </div>
                            </div>

                            {selectedUser.profile && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold">Información Personal</h4>
                                    <div className="space-y-2 text-sm">
                                        {selectedUser.profile.identificacion && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Identificación:</span>
                                                <span className="font-medium">{selectedUser.profile.identificacion}</span>
                                            </div>
                                        )}
                                        {selectedUser.profile.nombres && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nombres:</span>
                                                <span className="font-medium">{selectedUser.profile.nombres}</span>
                                            </div>
                                        )}
                                        {selectedUser.profile.apellido && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Apellido:</span>
                                                <span className="font-medium">{selectedUser.profile.apellido}</span>
                                            </div>
                                        )}
                                        {selectedUser.profile.telefono && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Teléfono:</span>
                                                <span className="font-medium">{selectedUser.profile.telefono}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h4 className="font-semibold">Estadísticas</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fecha de registro:</span>
                                        <span className="font-medium">
                                            {format(new Date(selectedUser.createdAt), "dd/MM/yyyy HH:mm")}
                                        </span>
                                    </div>
                                    {selectedUser._count && (
                                        <>
                                            {selectedUser.role === "teacher" && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Cursos creados:</span>
                                                    <span className="font-medium">{selectedUser._count.coursesCreated}</span>
                                                </div>
                                            )}
                                            {selectedUser.role === "student" && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Cursos inscritos:</span>
                                                        <span className="font-medium">{selectedUser._count.enrollments}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Entregas realizadas:</span>
                                                        <span className="font-medium">{selectedUser._count.submissions}</span>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            Crea un nuevo profesor o administrador. Los estudiantes no pueden ser creados desde aquí.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                placeholder="Juan Pérez"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan@ejemplo.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as "teacher" | "admin")} disabled={isPending}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">Profesor</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateUser}
                            disabled={isPending}
                        >
                            {isPending ? "Creando..." : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
