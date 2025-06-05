"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from "@/lib/supabase-provider"

const formSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type FormData = z.infer<typeof formSchema>

export default function LoginForm() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTOTP, setShowTOTP] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [userWithTOTP, setUserWithTOTP] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: FormData) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("No se pudo autenticar el usuario")
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        toast({
          variant: "destructive",
          title: "Email no verificado",
          description: "Por favor verifica tu correo electrónico antes de iniciar sesión.",
        })
        setIsLoading(false)
        return
      }

      // Check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle()

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw new Error("Error al obtener datos del usuario")
      }

      // If user doesn't exist in users table, create it
      if (!userData) {
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || data.user.email!.split("@")[0],
          role: "external_personnel", // Default role
          department: "Sin asignar",
          totp_enabled: false,
        })

        if (insertError) {
          console.error("Error creating user profile:", insertError)
          throw new Error("Error al crear el perfil de usuario")
        }

        toast({
          title: "Perfil creado",
          description: "Se ha creado tu perfil. Un administrador debe asignar tu rol y departamento.",
        })
      }

      // Check if user has TOTP enabled (only if userData exists)
      if (userData?.totp_enabled && userData?.totp_secret) {
        setUserWithTOTP(userData)
        setShowTOTP(true)
        setIsLoading(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Ocurrió un error al iniciar sesión",
      })
      setIsLoading(false)
    }
  }

  const handleTOTPSubmit = async () => {
    if (!userWithTOTP || !totpCode || totpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Código requerido",
        description: "Por favor ingresa un código de 6 dígitos",
      })
      return
    }

    setIsLoading(true)
    try {
      // Verify TOTP using our API endpoint
      const response = await fetch("/api/verify-totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: userWithTOTP.totp_secret,
          token: totpCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al verificar el código")
      }

      if (!result.valid) {
        throw new Error("Código TOTP inválido")
      }

      // If TOTP is valid, proceed to dashboard
      toast({
        title: "Verificación exitosa",
        description: "Has iniciado sesión correctamente",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("TOTP verification error:", error)
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: error.message || "Código TOTP inválido",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!showTOTP ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              placeholder="correo@ejemplo.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isLoading}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
              </Button>
            </div>
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Verificación de Dos Factores</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totp">Código de verificación</Label>
            <Input
              id="totp"
              placeholder="123456"
              value={totpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setTotpCode(value)
              }}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground text-center">
              Código de 6 dígitos de tu aplicación de autenticación
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleTOTPSubmit} className="w-full" disabled={isLoading || totpCode.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowTOTP(false)
                setTotpCode("")
                setUserWithTOTP(null)
              }}
              disabled={isLoading}
            >
              Volver al Login
            </Button>
          </div>
        </div>
      )}

      {!showTOTP && (
        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Regístrate
          </Link>
        </div>
      )}
    </>
  )
}
