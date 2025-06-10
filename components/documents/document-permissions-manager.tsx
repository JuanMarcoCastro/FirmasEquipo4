"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    fetchPermissions()
    fetchAvailableUsers()
  }, [documentId])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
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
        .order("created_at", { ascending: true })

      if (error) throw error

      console.log("Fetched permissions:", data)
      setPermissions(data || [])

      // Debug info
      setDebugInfo({
        permissionsCount: data?.length || 0,
        documentId,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error fetching permissions:", error)
      toast({
        variant: "destructive",
        title: "Error al cargar permisos",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, department")
        .order("full_name")

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error: any) {
      console.error("Error fetching users:", error)
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
      console.log("Adding permission:", { documentId, selectedUser, permissionType })

      // Check if this specific permission already exists
      const { data: existingPermission, error: checkError } = await supabase
        .from("document_permissions")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", selectedUser)
        .eq("permission_type", permissionType)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

      if (checkError) {
        console.error("Error checking existing permission:", checkError)
        throw new Error(`Error verificando permisos existentes: ${checkError.message}`)
      }

      if (existingPermission) {
        toast({
          variant: "destructive",
          title: "Permiso ya existe",
          description: "El usuario ya tiene este tipo de permiso para este documento.",
        })
        setLoading(false)
        return
      }

      // If adding sign permission, ensure user also has view permission
      if (permissionType === "sign") {
        const { data: viewPermission, error: viewCheckError } = await supabase
          .from("document_permissions")
          .select("*")
          .eq("document_id", documentId)
          .eq("user_id", selectedUser)
          .eq("permission_type", "view")
          .maybeSingle()

        if (viewCheckError) {
          console.error("Error checking view permission:", viewCheckError)
        }

        if (!viewPermission && !viewCheckError) {
          console.log("Adding view permission first...")
          // Add view permission first
          const { error: viewError } = await supabase.from("document_permissions").insert({
            document_id: documentId,
            user_id: selectedUser,
            permission_type: "view",
          })

          if (viewError) {
            console.error("Error adding view permission:", viewError)

            // Check if it's a duplicate error for view permission
            if (viewError.code === "23505") {
              console.log("View permission already exists, continuing...")
            } else {
              throw new Error(`Error agregando permiso de visualización: ${viewError.message}`)
            }
          }
        }
      }

      // Add the requested permission
      console.log("Adding main permission...")
      const { error } = await supabase.from("document_permissions").insert({
        document_id: documentId,
        user_id: selectedUser,
        permission_type: permissionType,
      })

      if (error) {
        console.error("Error adding permission:", error)

        // Handle duplicate key error specifically
        if (error.code === "23505") {
          toast({
            variant: "destructive",
            title: "Permiso duplicado",
            description: "El usuario ya tiene este permiso. Actualizando la lista...",
          })
          fetchPermissions() // Refresh to show current state
          setLoading(false)
          return
        }

        throw new Error(`Error agregando permiso: ${error.message}`)
      }

      toast({
        title: "Permiso agregado exitosamente",
        description: `El usuario ahora tiene permiso para ${getPermissionText(permissionType).toLowerCase()} este documento.`,
      })

      setSelectedUser("")
      setSearchTerm("")
      fetchPermissions()
    } catch (error: any) {
      console.error("Permission addition error:", error)
      toast({
        variant: "destructive",
        title: "Error al agregar permiso",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const removePermission = async (permissionId: string, permissionType: string, userId: string) => {
    setLoading(true)
    try {
      // If removing view permission, check if user has sign permission
      if (permissionType === "view") {
        const hasSignPermission = permissions.some(
          (p) => p.user_id === userId && p.permission_type === "sign" && p.id !== permissionId,
        )

        if (hasSignPermission) {
          toast({
            variant: "destructive",
            title: "No se puede eliminar el permiso de visualización",
            description: "El usuario tiene permiso para firmar este documento. Elimine primero el permiso de firma.",
          })
          setLoading(false)
          return
        }
      }

      const { error } = await supabase.from("document_permissions").delete().eq("id", permissionId)

      if (error) {
        console.error("Error removing permission:", error)
        throw new Error(`Error eliminando permiso: ${error.message}`)
      }

      toast({
        title: "Permiso eliminado",
        description: `El permiso de ${getPermissionText(permissionType).toLowerCase()} ha sido eliminado.`,
      })

      fetchPermissions()
    } catch (error: any) {
      console.error("Permission removal error:", error)
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

  // Group permissions by user
  const permissionsByUser: Record<string, Permission[]> = {}
  permissions.forEach((permission) => {
    if (!permissionsByUser[permission.user_id]) {
      permissionsByUser[permission.user_id] = []
    }
    permissionsByUser[permission.user_id].push(permission)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Gestionar Permisos
          <Button variant="outline" size="sm" onClick={fetchPermissions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <CardDescription>Controla quién puede ver y firmar este documento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug Info */}
        {debugInfo && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-700">
              Permisos cargados: {debugInfo.permissionsCount} | ID Documento: {debugInfo.documentId.substring(0, 8)}...
              | Actualizado: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

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

          {permissionType === "sign" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Al asignar permiso de firma, el usuario también recibirá automáticamente permiso de visualización si no
                lo tiene.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={addPermission} disabled={!selectedUser || loading} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? "Agregando..." : "Agregar Permiso"}
          </Button>
        </div>

        {/* Current Permissions */}
        <div className="space-y-4">
          <h4 className="font-medium">Permisos Actuales ({permissions.length})</h4>
          {Object.keys(permissionsByUser).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(permissionsByUser).map(([userId, userPermissions]) => {
                const user = userPermissions[0]?.users
                if (!user) return null

                return (
                  <div key={userId} className="border rounded-lg p-3">
                    <div className="mb-2">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.department}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                          <Badge variant={getPermissionBadgeVariant(permission.permission_type)}>
                            {getPermissionText(permission.permission_type)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              removePermission(permission.id, permission.permission_type, permission.user_id)
                            }
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay permisos asignados</p>
              <p className="text-sm text-muted-foreground">Agrega usuarios para que puedan acceder a este documento</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
