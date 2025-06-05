"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2 } from "lucide-react"

interface User {
  id: string
  full_name: string
  email: string
  role: string
  department: string
}

interface Permission {
  id: string
  user_id: string
  permission_type: string
  users: User
}

interface DocumentPermissionsManagerProps {
  documentId: string
  currentUserId: string
}

export default function DocumentPermissionsManager({ documentId, currentUserId }: DocumentPermissionsManagerProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [permissionType, setPermissionType] = useState("sign")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPermissions()
    fetchAvailableUsers()
  }, [documentId])

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("document_permissions")
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            role,
            department
          )
        `)
        .eq("document_id", documentId)

      if (error) throw error
      setPermissions(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar permisos",
        description: error.message,
      })
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, department")
        .neq("id", currentUserId)

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar usuarios",
        description: error.message,
      })
    }
  }

  const addPermission = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const { error } = await supabase.from("document_permissions").insert({
        document_id: documentId,
        user_id: selectedUser,
        permission_type: permissionType,
      })

      if (error) throw error

      toast({
        title: "Permiso agregado",
        description: "El usuario ahora tiene acceso al documento.",
      })

      setSelectedUser("")
      fetchPermissions()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al agregar permiso",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const removePermission = async (permissionId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("document_permissions").delete().eq("id", permissionId)

      if (error) throw error

      toast({
        title: "Permiso eliminado",
        description: "El usuario ya no tiene acceso al documento.",
      })

      fetchPermissions()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar permiso",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPermissionBadgeVariant = (type: string) => {
    switch (type) {
      case "sign":
        return "default" as const
      case "view":
        return "secondary" as const
      case "manage":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  const getPermissionText = (type: string) => {
    switch (type) {
      case "sign":
        return "Firmar"
      case "view":
        return "Ver"
      case "manage":
        return "Gestionar"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Permisos</CardTitle>
        <CardDescription>Controla quién puede ver y firmar este documento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Permission */}
        <div className="space-y-4">
          <h4 className="font-medium">Agregar Permiso</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={permissionType} onValueChange={setPermissionType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Ver</SelectItem>
                <SelectItem value="sign">Firmar</SelectItem>
                <SelectItem value="manage">Gestionar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user.id)
                    setSearchTerm(user.full_name)
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addPermission} disabled={!selectedUser || loading} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar Permiso
          </Button>
        </div>

        {/* Current Permissions */}
        <div className="space-y-4">
          <h4 className="font-medium">Permisos Actuales</h4>
          {permissions.length > 0 ? (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{permission.users.full_name}</p>
                      <p className="text-xs text-muted-foreground">{permission.users.email}</p>
                      <p className="text-xs text-muted-foreground">{permission.users.department}</p>
                    </div>
                    <Badge variant={getPermissionBadgeVariant(permission.permission_type)}>
                      {getPermissionText(permission.permission_type)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePermission(permission.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay permisos asignados</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
