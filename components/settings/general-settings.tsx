"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function GeneralSettings() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    organizationName: "Casa Monarca ayuda humanitaria al migrante A. B. P.",
    organizationDescription: "Sistema de gestión documental y firmas digitales",
    contactEmail: "contacto@casamonarca.org.mx",
    maxFileSize: "10",
    allowedFileTypes: "pdf,doc,docx,jpg,png",
    maintenanceMode: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
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
      // Por ahora solo simulamos un guardado exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuración guardada",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="organizationName">Nombre de la Organización</Label>
          <Input
            id="organizationName"
            name="organizationName"
            value={settings.organizationName}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="organizationDescription">Descripción</Label>
          <Textarea
            id="organizationDescription"
            name="organizationDescription"
            value={settings.organizationDescription}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Email de Contacto</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={settings.contactEmail}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
            <Input
              id="maxFileSize"
              name="maxFileSize"
              type="number"
              value={settings.maxFileSize}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allowedFileTypes">Tipos de Archivo Permitidos</Label>
            <Input
              id="allowedFileTypes"
              name="allowedFileTypes"
              value={settings.allowedFileTypes}
              onChange={handleChange}
              placeholder="pdf,doc,docx,jpg,png"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => handleSwitchChange("maintenanceMode", checked)}
          />
          <Label htmlFor="maintenanceMode">Modo Mantenimiento</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  )
}
