"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save, Key, Upload } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "Admin Usuario",
    email: "admin@example.com",
    role: "Admin",
    avatar: "/placeholder.svg?height=200&width=200",
  })
  const [successMessage, setSuccessMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleSaveProfile = () => {
    // Simulamos guardar el perfil
    setSuccessMessage("Perfil actualizado correctamente")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Crear una URL para previsualizar la imagen
      const imageUrl = URL.createObjectURL(file)
      setPreviewImage(imageUrl)

      // En una implementación real, aquí subiríamos la imagen al servidor
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Perfil de Usuario</h1>
            <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>Actualiza tu imagen de perfil</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={previewImage || user.avatar} alt={user.name} />
                <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <Button onClick={triggerFileInput} variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Cambiar Imagen
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tus datos personales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" value={user.role} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </div>

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
            <Button>
              <Key className="h-4 w-4 mr-2" />
              Actualizar Contraseña
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
