import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Upload, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default async function CertificatesPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user certificates
  const { data: certificates } = await supabase
    .from("user_certificates")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Certificados</h1>
          <p className="text-muted-foreground">Gestiona tus certificados digitales para firmar documentos</p>
        </div>
        <Link href="/dashboard/certificates/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Subir Certificado
          </Button>
        </Link>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{certificate.certificate_name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Subido{" "}
                          {formatDistanceToNow(new Date(certificate.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        {certificate.is_active ? (
                          <span className="flex items-center text-xs text-green-600">
                            <Check className="mr-1 h-3 w-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-red-600">
                            <X className="mr-1 h-3 w-3" />
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/certificates/${certificate.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </Link>
                    {!certificate.is_active && (
                      <Link href={`/dashboard/certificates/${certificate.id}/activate`}>
                        <Button size="sm">Activar</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No tienes certificados</CardTitle>
            <CardDescription>Sube tu primer certificado digital para poder firmar documentos</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Los certificados digitales te permiten firmar documentos de manera segura y verificable. Sube tu
              certificado para comenzar a firmar documentos.
            </p>
            <Link href="/dashboard/certificates/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Subir Certificado
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
