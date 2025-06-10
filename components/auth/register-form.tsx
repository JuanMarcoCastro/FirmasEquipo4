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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase-provider"
import { departments } from "@/lib/rbac"

const formSchema = z
  .object({
    fullName: z.string().min(3, "El nombre completo es requerido"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["external_personnel", "operational_staff"], {
      required_error: "El rol es requerido",
    }),
    department: z.string().min(1, "El departamento es requerido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export default function RegisterForm() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "external_personnel",
      department: "",
    },
  })

  const watchRole = watch("role")
  const watchDepartment = watch("department")

  const onSubmit = async (values: FormData) => {
    setIsLoading(true)
    try {
      console.log("Starting registration process for:", values.email)

      // First, check if user already exists in auth.users
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
      const userExists = existingAuthUser.users?.some((user) => user.email === values.email)

      if (userExists) {
        throw new Error("Ya existe una cuenta con este correo electrónico")
      }

      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", values.email)
        .maybeSingle()

      if (existingUser) {
        throw new Error("Ya existe un usuario registrado con este correo electrónico")
      }

      console.log("Creating auth user...")

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) {
        console.error("Auth error:", authError)
        throw new Error(`Error de autenticación: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario en el sistema de autenticación")
      }

      console.log("Auth user created successfully:", authData.user.id)

      // Wait a moment for the auth user to be fully created
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Creating user profile...")

      // Insert user data into users table with retry logic
      let profileCreated = false
      let attempts = 0
      const maxAttempts = 3

      while (!profileCreated && attempts < maxAttempts) {
        try {
          const { error: profileError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: values.email,
            full_name: values.fullName,
            role: values.role,
            department: values.department,
            totp_enabled: false,
          })

          if (profileError) {
            console.error(`Profile creation attempt ${attempts + 1} failed:`, profileError)

            if (profileError.code === "23505") {
              // Unique constraint violation - user already exists
              console.log("User profile already exists, checking if it's complete...")

              const { data: existingProfile } = await supabase
                .from("users")
                .select("*")
                .eq("id", authData.user.id)
                .single()

              if (existingProfile) {
                console.log("User profile exists and is complete")
                profileCreated = true
                break
              }
            }

            if (attempts === maxAttempts - 1) {
              throw new Error(`Error al crear el perfil de usuario: ${profileError.message}`)
            }

            attempts++
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            console.log("User profile created successfully")
            profileCreated = true
          }
        } catch (insertError: any) {
          console.error(`Profile insertion error on attempt ${attempts + 1}:`, insertError)

          if (attempts === maxAttempts - 1) {
            throw new Error(`Error al guardar el perfil: ${insertError.message}`)
          }

          attempts++
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      if (!profileCreated) {
        throw new Error("No se pudo crear el perfil de usuario después de varios intentos")
      }

      toast({
        title: "Cuenta creada exitosamente",
        description: "Por favor verifica tu correo electrónico para confirmar tu cuenta.",
      })

      console.log("Registration completed successfully")
      router.push("/login?message=registration-success")
    } catch (error: any) {
      console.error("Registration error:", error)

      let errorMessage = "Ocurrió un error al crear la cuenta"

      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        switch (error.code) {
          case "user_already_exists":
            errorMessage = "Ya existe una cuenta con este correo electrónico"
            break
          case "weak_password":
            errorMessage = "La contraseña es muy débil"
            break
          case "invalid_email":
            errorMessage = "El correo electrónico no es válido"
            break
          default:
            errorMessage = `Error del sistema: ${error.code}`
        }
      }

      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" placeholder="Juan Pérez" disabled={isLoading} {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
      </div>

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
            autoComplete="new-password"
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            placeholder="••••••••"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
          </Button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={watchRole}
          onValueChange={(value) => setValue("role", value as "external_personnel" | "operational_staff")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="external_personnel">Personal Externo</SelectItem>
            <SelectItem value="operational_staff">Personal Operativo</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Departamento</Label>
        <Select value={watchDepartment} onValueChange={(value) => setValue("department", value)} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.department && <p className="text-sm text-red-600">{errors.department.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          "Registrarse"
        )}
      </Button>

      <div className="mt-4 text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </div>
    </form>
  )
}
