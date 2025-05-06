"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Save, Key, Bell, Shield, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/dashboard-layout"

export default function SettingsPage() {
  const [successMessage, setSuccessMessage] = useState("")

  const handleSaveSettings = () => {
    // Simulamos guardar la configuración
    setSuccessMessage("Configuración guardada correctamente")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">Personaliza tu experiencia en el sistema</p>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de Perfil</CardTitle>
                <CardDescription>Actualiza tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" defaultValue="Admin Usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" defaultValue="admin@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input id="role" defaultValue="Administrador" disabled />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Key className="h-4 w-4 mr-2" />
                  Actualizar Contraseña
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Firma Digital</CardTitle>
                <CardDescription>Gestiona tu certificado de firma digital</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signature-type">Tipo de Firma</Label>
                  <Select defaultValue="simple">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Firma Simple</SelectItem>
                      <SelectItem value="advanced">Firma Avanzada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature-password">Contraseña de Firma</Label>
                  <Input id="signature-password" type="password" />
                </div>
                <div className="pt-2">
                  <Button variant="outline">Generar Nuevo Certificado</Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Guardar Configuración</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones por correo electrónico</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="signature-requests">Solicitudes de Firma</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones cuando alguien solicita tu firma</p>
                  </div>
                  <Switch id="signature-requests" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="document-uploads">Subida de Documentos</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones cuando se suben nuevos documentos</p>
                  </div>
                  <Switch id="document-uploads" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="completed-signatures">Firmas Completadas</Label>
                    <p className="text-sm text-muted-foreground">Notificaciones cuando se completan todas las firmas</p>
                  </div>
                  <Switch id="completed-signatures" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Guardar Preferencias</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
