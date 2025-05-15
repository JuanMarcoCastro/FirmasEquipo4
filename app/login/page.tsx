"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { TwoFactorVerification } from "@/components/two-factor-verification"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [userRole, setUserRole] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulación de login - en producción, esto sería una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verificar credenciales
      let role = ""

      if (email === "juanmarco.ct@gmail.com" && password === "admin123") {
        role = "admin"
        // Para este usuario específico, activamos la verificación de dos factores
        setUserRole(role)
        setShowTwoFactor(true)
        setIsLoading(false)

        // Simulación de envío de código por correo
        toast({
          title: "Código de verificación enviado",
          description: `Se ha enviado un código de verificación a ${email}`,
        })

        return
      } else if (email.includes("admin") && password === "admin123") {
        role = "admin"
      } else if (email.includes("sub_admin") && password === "admin123") {
        role = "sub_admin"
      } else if (email.includes("coord") && password === "admin123") {
        role = "management"
      } else if (email.includes("ops") && password === "admin123") {
        role = "employer"
      } else if (email.includes("externo") && password === "admin123") {
        role = "public"
      } else {
        toast({
          title: "Error de autenticación",
          description: "Credenciales inválidas. Por favor, intente nuevamente.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Para usuarios normales, redirigir directamente
      router.push(`/dashboard/${role}`)
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Por favor, intente más tarde.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleVerificationSuccess = () => {
    toast({
      title: "Verificación exitosa",
      description: "Has iniciado sesión correctamente.",
    })
    router.push(`/dashboard/${userRole}`)
  }

  const handleVerificationCancel = () => {
    setShowTwoFactor(false)
    setIsLoading(false)
  }

  if (showTwoFactor) {
    return (
      <TwoFactorVerification email={email} onSuccess={handleVerificationSuccess} onCancel={handleVerificationCancel} />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div id="logo" className="mx-auto mb-4 h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">CM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CasaMonarca</h1>
          <p className="text-gray-600">Sistema de Firma Digital</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@casamonarca.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Cuentas de prueba:</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>juanmarco.ct@gmail.com (con 2FA)</p>
            <p>admin@casamonarca.com</p>
            <p>sub_admin@casamonarca.com</p>
            <p>coord_humanitaria@casamonarca.com</p>
            <p>ops_legal@casamonarca.com</p>
          </div>
          <p className="mt-2 text-xs text-gray-500">Contraseña para todas: admin123</p>
        </div>
      </div>
    </div>
  )
}
