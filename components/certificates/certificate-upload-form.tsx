"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Upload, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase-provider"

const formSchema = z
  .object({
    certificateName: z.string().min(3, "El nombre del certificado es requerido"),
    certificateFile: z.instanceof(File).refine((file) => file.size < 5000000, {
      message: "El archivo debe ser menor a 5MB",
    }),
    privateKeyFile: z.instanceof(File).refine((file) => file.size < 5000000, {
      message: "El archivo debe ser menor a 5MB",
    }),
    password: z.string().min(1, "La contraseña es requerida"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

interface CertificateUploadFormProps {
  userId: string
}

export default function CertificateUploadForm({ userId }: CertificateUploadFormProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      certificateName: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Upload certificate file
      const certFileName = `${userId}/${Date.now()}_${values.certificateFile.name}`
      const { error: certUploadError } = await supabase.storage
        .from("certificates")
        .upload(certFileName, values.certificateFile)

      if (certUploadError) {
        throw certUploadError
      }

      // Upload private key file
      const keyFileName = `${userId}/${Date.now()}_${values.privateKeyFile.name}`
      const { error: keyUploadError } = await supabase.storage
        .from("private_keys")
        .upload(keyFileName, values.privateKeyFile)

      if (keyUploadError) {
        throw keyUploadError
      }

      // Create certificate record
      const { error: dbError } = await supabase.from("user_certificates").insert({
        user_id: userId,
        certificate_name: values.certificateName,
        certificate_reference: certFileName,
        private_key_reference: keyFileName,
        is_active: true,
      })

      if (dbError) {
        throw dbError
      }

      toast({
        title: "Certificado subido exitosamente",
        description: "Tu certificado ha sido subido y está listo para ser utilizado.",
      })

      router.push("/dashboard/certificates")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir certificado",
        description: error.message || "Ocurrió un error al subir el certificado",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Certificado Digital</CardTitle>
        <CardDescription>Sube tu certificado digital y clave privada para firmar documentos</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="certificateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del certificado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Certificado Personal" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificateFile"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Archivo de certificado (.cer, .pem, .p12)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".cer,.pem,.p12,.pfx"
                      disabled={isLoading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onChange(file)
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="privateKeyFile"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Archivo de clave privada (.key, .pem)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".key,.pem"
                      disabled={isLoading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onChange(file)
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña del certificado</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Ingresa la contraseña de tu certificado"
                        type={showPassword ? "text" : "password"}
                        disabled={isLoading}
                        {...field}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Confirma la contraseña"
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">
                          {showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir Certificado
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
