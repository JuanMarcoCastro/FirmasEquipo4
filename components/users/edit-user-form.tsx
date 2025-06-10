"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase-browser"
import { departments, getRoleDisplayText } from "@/lib/rbac"

interface EditUserFormProps {
  user: {
    id: string
    email: string
    full_name: string
    phone: string | null
    role: string
    department: string | null
    totp_enabled: boolean
  }
}

export function EditUserForm({ user }: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone || "",
    role: user.role,
    department: user.department || "",
    totp_enabled: user.totp_enabled,
  })

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.role,
          department: formData.department || null,
          totp_enabled: formData.totp_enabled,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Usuario actualizado",
        description: "La información del usuario se ha actualizado correctamente.",
      })

      router.push(`/dashboard/users/${user.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Email enviado",
        description: "Se ha enviado un email para restablecer la contraseña.",
      })
    } catch (error) {
      console.error("Error sending reset email:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el email de restablecimiento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!user.totp_enabled) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          totp_enabled: false,
          totp_secret: null,
        })
        .eq("id", user.id)

      if (error) throw error

      setFormData({ ...formData, totp_enabled: false })

      toast({
        title: "2FA deshabilitado",
        description: "La autenticación de dos factores ha sido deshabilitada.",
      })
    } catch (error) {
      console.error("Error disabling 2FA:", error)
      toast({
        title: "Error",
        description: "No se pudo deshabilitar el 2FA.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre Completo</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system_admin">{getRoleDisplayText("system_admin")}</SelectItem>
              <SelectItem value="area_coordinator">{getRoleDisplayText("area_coordinator")}</SelectItem>
              <SelectItem value="operational_staff">{getRoleDisplayText("operational_staff")}</SelectItem>
              <SelectItem value="external_personnel">{getRoleDisplayText("external_personnel")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Autenticación de Dos Factores</h3>
            <p className="text-sm text-muted-foreground">
              {formData.totp_enabled ? "2FA está activo para este usuario" : "2FA está desactivado"}
            </p>
          </div>
          {formData.totp_enabled && (
            <Button type="button" variant="outline" onClick={handleDisable2FA} disabled={isLoading}>
              Deshabilitar 2FA
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Restablecer Contraseña</h3>
            <p className="text-sm text-muted-foreground">Enviar email para restablecer contraseña</p>
          </div>
          <Button type="button" variant="outline" onClick={handleResetPassword} disabled={isLoading}>
            Enviar Email
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
