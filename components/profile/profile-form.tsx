"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase-provider"
import { departments, getRoleDisplayText } from "@/lib/rbac"

const formSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  department: z.string().min(1, "El departamento es requerido"),
})

interface ProfileFormProps {
  user: {
    id: string
    full_name: string
    email: string
    role: string
    department: string
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user.full_name,
      email: user.email,
      department: user.department,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: values.fullName,
          department: values.department,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      // Update auth user metadata if email changed
      if (values.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: values.email,
        })

        if (authError) {
          throw authError
        }

        toast({
          title: "Perfil actualizado",
          description: "Se ha enviado un correo de verificación a tu nueva dirección de email.",
        })
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu información personal ha sido actualizada correctamente.",
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar perfil",
        description: error.message || "Ocurrió un error al actualizar tu perfil",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Rol</label>
          <p className="text-sm text-muted-foreground">{getRoleDisplayText(user.role as any)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            El rol es asignado por un administrador y no puede ser modificado
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">ID de Usuario</label>
          <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="correo@ejemplo.com" type="email" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un departamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
