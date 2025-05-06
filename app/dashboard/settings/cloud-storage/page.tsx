"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save, Cloud, Database } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function CloudStoragePage() {
  const [useCloudStorage, setUseCloudStorage] = useState(false)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [tenantId, setTenantId] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSaveSettings = () => {
    if (useCloudStorage && (!clientId || !clientSecret || !tenantId)) {
      setErrorMessage("Por favor completa todos los campos de configuración de Microsoft Graph API")
      return
    }

    // Aquí se enviarían los datos al backend
    setSuccessMessage("Configuración de almacenamiento guardada correctamente")
    setErrorMessage("")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Configuración de Almacenamiento</h1>
            <p className="text-muted-foreground">Configura dónde se almacenarán los documentos PDF</p>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Opciones de Almacenamiento</CardTitle>
            <CardDescription>Elige dónde se guardarán los documentos PDF y las firmas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <Label htmlFor="local-storage">Almacenamiento Local</Label>
                </div>
                <p className="text-sm text-muted-foreground">Los documentos se guardarán en el servidor local</p>
              </div>
              <Switch
                id="local-storage"
                checked={!useCloudStorage}
                onCheckedChange={(checked) => setUseCloudStorage(!checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  <Label htmlFor="cloud-storage">Almacenamiento en OneDrive</Label>
                </div>
                <p className="text-sm text-muted-foreground">Los documentos se guardarán en Microsoft OneDrive</p>
              </div>
              <Switch
                id="cloud-storage"
                checked={useCloudStorage}
                onCheckedChange={(checked) => setUseCloudStorage(checked)}
              />
            </div>

            {useCloudStorage && (
              <div className="border rounded-md p-4 space-y-4 mt-4">
                <h3 className="font-medium">Configuración de Microsoft Graph API</h3>
                <p className="text-sm text-muted-foreground">
                  Para usar OneDrive, necesitas registrar una aplicación en Azure Portal y proporcionar las credenciales
                </p>

                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Ingresa el Client ID de tu aplicación de Azure"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Ingresa el Client Secret de tu aplicación de Azure"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant-id">Tenant ID</Label>
                  <Input
                    id="tenant-id"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="Ingresa el Tenant ID de tu directorio de Azure AD"
                  />
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm">
                    Probar Conexión
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migración de Documentos</CardTitle>
            <CardDescription>Migra documentos existentes entre sistemas de almacenamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Si cambias el sistema de almacenamiento, puedes migrar los documentos existentes al nuevo sistema. Esto
              asegurará que todos los documentos estén disponibles en la misma ubicación.
            </p>

            <div className="flex gap-4">
              <Button variant="outline">Migrar a Almacenamiento Local</Button>
              <Button variant="outline">Migrar a OneDrive</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
