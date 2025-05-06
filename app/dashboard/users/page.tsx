"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, MoreVertical, Edit, Trash, Shield, Key } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddUser = () => {
    // En una implementación real, esto enviaría los datos al backend
    setShowAddUserDialog(false)
  }

  const handleUpdatePermissions = () => {
    // En una implementación real, esto actualizaría los permisos en el backend
    setShowPermissionsDialog(false)
  }

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user)
    setShowPermissionsDialog(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800"
      case "Sub_Admin":
        return "bg-orange-100 text-orange-800"
      case "Management":
        return "bg-blue-100 text-blue-800"
      case "Employer":
        return "bg-green-100 text-green-800"
      case "Public":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios y sus permisos en el sistema</p>
          </div>

          <Button onClick={() => setShowAddUserDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Añadir Usuario
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Lista de todos los usuarios registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Gestionar Permisos
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              Restablecer Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Eliminar Usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Diálogo para añadir usuario */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
              <DialogDescription>Completa el formulario para crear un nuevo usuario</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" placeholder="Nombre del usuario" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrador</SelectItem>
                    <SelectItem value="Sub_Admin">Sub-Administrador</SelectItem>
                    <SelectItem value="Management">Gerencia</SelectItem>
                    <SelectItem value="Employer">Empleado</SelectItem>
                    <SelectItem value="Public">Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUser}>Crear Usuario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para gestionar permisos */}
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionar Permisos</DialogTitle>
              <DialogDescription>
                Configura los permisos para {selectedUser?.name} ({selectedUser?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rol del Usuario</Label>
                <Select defaultValue={selectedUser?.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrador</SelectItem>
                    <SelectItem value="Sub_Admin">Sub-Administrador</SelectItem>
                    <SelectItem value="Management">Gerencia</SelectItem>
                    <SelectItem value="Employer">Empleado</SelectItem>
                    <SelectItem value="Public">Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permisos Específicos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-upload" className="rounded border-gray-300" />
                    <Label htmlFor="perm-upload">Subir Documentos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-sign" className="rounded border-gray-300" />
                    <Label htmlFor="perm-sign">Firmar Documentos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-create-folder" className="rounded border-gray-300" />
                    <Label htmlFor="perm-create-folder">Crear Carpetas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-delete" className="rounded border-gray-300" />
                    <Label htmlFor="perm-delete">Eliminar Documentos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-request-sign" className="rounded border-gray-300" />
                    <Label htmlFor="perm-request-sign">Solicitar Firmas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="perm-manage-users" className="rounded border-gray-300" />
                    <Label htmlFor="perm-manage-users">Gestionar Usuarios</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Acceso a Carpetas</Label>
                <div className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="folder-contracts" className="rounded border-gray-300" />
                    <Label htmlFor="folder-contracts">Contratos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="folder-finance" className="rounded border-gray-300" />
                    <Label htmlFor="folder-finance">Finanzas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="folder-reports" className="rounded border-gray-300" />
                    <Label htmlFor="folder-reports">Reportes</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePermissions}>Guardar Permisos</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
