"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SecuritySettings() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    require2FA: true,
    sessionTimeout: "60",
    minPasswordLength: "8",
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    maxLoginAttempts: "5",
    lockoutDuration: "30",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Aquí iría la lógica para guardar en Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuración de seguridad guardada",
        description: "Los cambios han sido guardados exitosamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecurityAction = async (action: string) => {
    setIsLoading(true)

    try {
      // Aquí iría la lógica para ejecutar acciones de seguridad
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Acción completada",
        description: `La acción "${action}" se ha completado exitosamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo completar la acción "${action}".`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="require2FA"
              checked={settings.require2FA}
              onCheckedChange={(checked) => handleSwitchChange("require2FA", checked)}
            />
            <Label htmlFor="require2FA">Requerir 2FA para todos los usuarios</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
            <Input
              id="sessionTimeout"
              name="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="minPasswordLength">Longitud Mínima de Contraseña</Label>
            <Input
              id="minPasswordLength"
              name="minPasswordLength"
              type="number"
              value={settings.minPasswordLength}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Requisitos de Contraseña</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireSpecialChars"
                checked={settings.requireSpecialChars}
                onCheckedChange={(checked) => handleSwitchChange("requireSpecialChars", checked)}
              />
              <Label htmlFor="requireSpecialChars">Caracteres especiales</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireNumbers"
                checked={settings.requireNumbers}
                onCheckedChange={(checked) => handleSwitchChange("requireNumbers", checked)}
              />
              <Label htmlFor="requireNumbers">Números</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireUppercase"
                checked={settings.requireUppercase}
                onCheckedChange={(checked) => handleSwitchChange("requireUppercase", checked)}
              />
              <Label htmlFor="requireUppercase">Mayúsculas</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxLoginAttempts">Intentos Máximos de Login</Label>
              <Input
                id="maxLoginAttempts"
                name="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lockoutDuration">Duración de Bloqueo (minutos)</Label>
              <Input
                id="lockoutDuration"
                name="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </form>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium mb-4">Acciones de Seguridad</h3>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Precaución</AlertTitle>
            <AlertDescription>
              Las siguientes acciones afectan a todos los usuarios del sistema. Úselas con precaución.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleSecurityAction("Cerrar todas las sesiones")}
              disabled={isLoading}
            >
              Cerrar todas las sesiones
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSecurityAction("Resetear intentos de login")}
              disabled={isLoading}
            >
              Resetear intentos de login
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSecurityAction("Regenerar claves de API")}
              disabled={isLoading}
            >
              Regenerar claves de API
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
