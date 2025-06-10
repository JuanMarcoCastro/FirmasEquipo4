"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, ArrowLeft, Shield, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const formSchema = z.object({
  certificateName: z.string().min(3, "El nombre del certificado debe tener al menos 3 caracteres"),
  organizationalUnit: z.string().min(2, "La unidad organizacional es requerida"),
  daysValid: z.number().min(30, "Mínimo 30 días").max(3650, "Máximo 10 años"),
})

interface CertificateGenerationFormProps {
  userId: string
  userData: {
    full_name?: string
    email?: string
    department?: string
  } | null
}

export function CertificateGenerationForm({ userId, userData }: CertificateGenerationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      certificateName: "Certificado Personal",
      organizationalUnit: userData?.department || "General",
      daysValid: 365,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate-user-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificate_name_prefix: values.certificateName,
          organizational_unit_name_input: values.organizationalUnit,
          days_valid: values.daysValid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error generando certificado")
      }

      toast({
        title: "Certificado generado exitosamente",
        description: `Tu certificado "${values.certificateName}" ha sido creado y está listo para usar.`,
      })

      router.push(`/dashboard/certificates/${data.certificate.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al generar certificado",
        description: error.message || "Ocurrió un error al generar el certificado",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Generar Nuevo Certificado Digital
          </CardTitle>
          <CardDescription>
            Se creará un certificado X.509 autofirmado con tu información personal. Este certificado será válido para
            firmar documentos dentro del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Información del certificado:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>
                  <strong>Nombre Común (CN):</strong> {userData?.full_name || "Tu nombre completo"}
                </li>
                <li>
                  <strong>Email:</strong> {userData?.email || "Tu email"}
                </li>
                <li>
                  <strong>Organización:</strong> Casa Monarca
                </li>
                <li>
                  <strong>País:</strong> México (MX)
                </li>
                <li>
                  <strong>Algoritmo:</strong> RSA 2048-bit con SHA256
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="certificateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del certificado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Certificado Personal 2024" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormDescription>Este nombre te ayudará a identificar el certificado en tu lista</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationalUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad Organizacional (Área)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Tecnología, Humanidades, Legal, Psicosocial"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>El área o departamento al que perteneces en Casa Monarca</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daysValid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de validez</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="30"
                        max="3650"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 365)}
                      />
                    </FormControl>
                    <FormDescription>Número de días que el certificado será válido (30 días - 10 años)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild disabled={isLoading}>
            <Link href="/dashboard/certificates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generar Certificado
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
