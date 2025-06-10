"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Shield, AlertTriangle } from "lucide-react"
import {
  allRoles,
  allPermissions,
  getRoleDisplayText,
  getPermissionDisplayText,
  type UserRole,
  type Permission,
} from "@/lib/rbac"

interface RolePermission {
  id: string
  role: string
  permission: string
  enabled: boolean
}

export default function RolePermissionsManager() {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Cargar permisos
  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/role-permissions")
      if (!response.ok) {
        throw new Error("Error al cargar permisos")
      }
      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (error) {
      console.error("Error fetching permissions:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePermission = async (role: string, permission: string, enabled: boolean) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/role-permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, permission, enabled }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar permiso")
      }

      // Actualizar estado local
      setPermissions((prev) =>
        prev.map((p) => (p.role === role && p.permission === permission ? { ...p, enabled } : p)),
      )

      toast({
        title: "Permiso actualizado",
        description: `${getPermissionDisplayText(permission as Permission)} para ${getRoleDisplayText(role as UserRole)} ${enabled ? "habilitado" : "deshabilitado"}`,
      })

      setHasChanges(true)
    } catch (error) {
      console.error("Error updating permission:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el permiso",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPermissionValue = (role: string, permission: string): boolean => {
    const perm = permissions.find((p) => p.role === role && p.permission === permission)
    return perm?.enabled || false
  }

  const getPermissionDescription = (permission: Permission): string => {
    const descriptions = {
      view: "Permite ver documentos y contenido del sistema",
      sign: "Permite firmar documentos digitalmente",
      manage: "Permite gestionar documentos y permisos",
      create: "Permite crear nuevos documentos y contenido",
      delete: "Permite eliminar documentos y contenido",
      admin: "Acceso completo de administración del sistema",
    }
    return descriptions[permission]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando permisos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cambios aplicados</AlertTitle>
          <AlertDescription>
            Los permisos se han actualizado y están activos inmediatamente. Los usuarios pueden necesitar cerrar sesión
            y volver a iniciar para ver todos los cambios reflejados.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {allRoles.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {getRoleDisplayText(role)}
              </CardTitle>
              <CardDescription>Configure los permisos para este rol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allPermissions.map((permission) => (
                  <div key={`${role}-${permission}`} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${role}-${permission}`}
                        checked={getPermissionValue(role, permission)}
                        onCheckedChange={(enabled) => updatePermission(role, permission, enabled)}
                        disabled={isSaving}
                      />
                      <Label htmlFor={`${role}-${permission}`} className="text-sm font-medium">
                        {getPermissionDisplayText(permission)}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">{getPermissionDescription(permission)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Los cambios en los permisos se aplican inmediatamente y afectan a todos los usuarios con estos roles. Tenga
          cuidado al modificar permisos críticos como "admin" o "delete".
        </AlertDescription>
      </Alert>
    </div>
  )
}
