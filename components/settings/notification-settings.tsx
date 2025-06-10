"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Send } from "lucide-react"

export default function NotificationSettings() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const [settings, setSettings] = useState({
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUser: "notifications@casamonarca.org.mx",
    smtpPassword: "••••••••••••",
    smtpFromEmail: "notifications@casamonarca.org.mx",
    smtpFromName: "Casa Monarca",
    enableSSL: true,
    notifyNewUsers: true,
    notifyDocumentUploads: true,
    notifySignatureRequests: true,
    notifySignatureCompleted: true,
    testEmail: "",
  })

  const [templates, setTemplates] = useState({
    welcomeEmail:
      "Bienvenido a Casa Monarca, {{name}}.\n\nSu cuenta ha sido creada exitosamente.\n\nSaludos,\nEquipo de Casa Monarca",
    documentUploadedEmail:
      "Hola {{name}},\n\nSe ha subido un nuevo documento: {{documentName}}.\n\nSaludos,\nEquipo de Casa Monarca",
    signatureRequestEmail:
      "Hola {{name}},\n\nSe requiere su firma para el documento: {{documentName}}.\n\nSaludos,\nEquipo de Casa Monarca",
    signatureCompletedEmail:
      "Hola {{name}},\n\nEl documento {{documentName}} ha sido firmado por todos los participantes.\n\nSaludos,\nEquipo de Casa Monarca",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTemplates((prev) => ({ ...prev, [name]: value }))
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
        title: "Configuración guardada",
        description: "La configuración de notificaciones ha sido guardada exitosamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!settings.testEmail) {
      toast({
        title: "Error",
        description: "Ingrese un email para la prueba.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)

    try {
      // Aquí iría la lógica para enviar email de prueba
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Email enviado",
        description: `Se ha enviado un email de prueba a ${settings.testEmail}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de prueba. Verifique la configuración SMTP.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Configuración SMTP</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input id="smtpHost" name="smtpHost" value={settings.smtpHost} onChange={handleChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtpPort">Puerto SMTP</Label>
                <Input id="smtpPort" name="smtpPort" value={settings.smtpPort} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtpUser">Usuario SMTP</Label>
                <Input id="smtpUser" name="smtpUser" value={settings.smtpUser} onChange={handleChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtpPassword">Contraseña SMTP</Label>
                <Input
                  id="smtpPassword"
                  name="smtpPassword"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtpFromEmail">Email Remitente</Label>
                <Input id="smtpFromEmail" name="smtpFromEmail" value={settings.smtpFromEmail} onChange={handleChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtpFromName">Nombre Remitente</Label>
                <Input id="smtpFromName" name="smtpFromName" value={settings.smtpFromName} onChange={handleChange} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableSSL"
                checked={settings.enableSSL}
                onCheckedChange={(checked) => handleSwitchChange("enableSSL", checked)}
              />
              <Label htmlFor="enableSSL">Usar SSL/TLS</Label>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-4">
                <Input
                  id="testEmail"
                  name="testEmail"
                  placeholder="Email para prueba"
                  value={settings.testEmail}
                  onChange={handleChange}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" onClick={handleTestEmail} disabled={isTesting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isTesting ? "Enviando..." : "Probar Configuración"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Notificaciones Automáticas</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="notifyNewUsers"
                checked={settings.notifyNewUsers}
                onCheckedChange={(checked) => handleSwitchChange("notifyNewUsers", checked)}
              />
              <Label htmlFor="notifyNewUsers">Nuevos usuarios registrados</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifyDocumentUploads"
                checked={settings.notifyDocumentUploads}
                onCheckedChange={(checked) => handleSwitchChange("notifyDocumentUploads", checked)}
              />
              <Label htmlFor="notifyDocumentUploads">Documentos subidos</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifySignatureRequests"
                checked={settings.notifySignatureRequests}
                onCheckedChange={(checked) => handleSwitchChange("notifySignatureRequests", checked)}
              />
              <Label htmlFor="notifySignatureRequests">Solicitudes de firma</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifySignatureCompleted"
                checked={settings.notifySignatureCompleted}
                onCheckedChange={(checked) => handleSwitchChange("notifySignatureCompleted", checked)}
              />
              <Label htmlFor="notifySignatureCompleted">Firmas completadas</Label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Plantillas de Email</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="welcomeEmail">Email de Bienvenida</Label>
              <Textarea
                id="welcomeEmail"
                name="welcomeEmail"
                value={templates.welcomeEmail}
                onChange={handleTemplateChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documentUploadedEmail">Notificación de Documento Subido</Label>
              <Textarea
                id="documentUploadedEmail"
                name="documentUploadedEmail"
                value={templates.documentUploadedEmail}
                onChange={handleTemplateChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signatureRequestEmail">Solicitud de Firma</Label>
              <Textarea
                id="signatureRequestEmail"
                name="signatureRequestEmail"
                value={templates.signatureRequestEmail}
                onChange={handleTemplateChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signatureCompletedEmail">Firma Completada</Label>
              <Textarea
                id="signatureCompletedEmail"
                name="signatureCompletedEmail"
                value={templates.signatureCompletedEmail}
                onChange={handleTemplateChange}
                rows={4}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </form>
    </div>
  )
}
