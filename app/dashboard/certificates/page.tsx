import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Upload, Plus, Eye, Key, Calendar, Building, Globe, Fingerprint } from "lucide-react"
import { formatDistanceToNow, format, parseISO } from "date-fns"
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

  // Get user certificates with detailed information
  const { data: certificates } = await supabase
    .from("user_certificates")
    .select(`
      *,
      cert_common_name,
      cert_email,
      cert_organization,
      cert_organizational_unit,
      cert_country,
      cert_serial_number,
      cert_valid_from,
      cert_valid_to,
      cert_issuer_common_name,
      cert_fingerprint_sha256
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  // Helper function to format certificate validity dates
  const formatCertDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch {
      return dateString
    }
  }

  // Helper function to check if certificate is expired
  const isCertificateExpired = (validTo?: string) => {
    if (!validTo) return false
    try {
      return new Date(validTo) < new Date()
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Certificados Digitales</h1>
          <p className="text-muted-foreground">
            Gestiona tus certificados digitales para firmar documentos de manera segura
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/certificates/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generar Certificado
            </Button>
          </Link>
          <Link href="/dashboard/certificates/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Subir Certificado
            </Button>
          </Link>
        </div>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid gap-6">
          {certificates.map((certificate) => {
            const isExpired = isCertificateExpired(certificate.cert_valid_to)
            const isActive = certificate.is_active && !isExpired

            return (
              <Card key={certificate.id} className={isExpired ? "border-red-200 bg-red-50/50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Shield className={`h-6 w-6 ${isExpired ? "text-red-500" : "text-primary"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg truncate">{certificate.certificate_name}</h3>
                          {isExpired && <Badge variant="destructive">Expirado</Badge>}
                          {isActive && <Badge variant="secondary">Activo</Badge>}
                          {!certificate.is_active && !isExpired && <Badge variant="outline">Inactivo</Badge>}
                        </div>

                        {/* Certificate Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          {certificate.cert_common_name && (
                            <div className="flex items-center gap-2">
                              <Key className="h-3 w-3" />
                              <span className="truncate">
                                <strong>CN:</strong> {certificate.cert_common_name}
                              </span>
                            </div>
                          )}
                          {certificate.cert_organizational_unit && (
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              <span className="truncate">
                                <strong>Área:</strong> {certificate.cert_organizational_unit}
                              </span>
                            </div>
                          )}
                          {certificate.cert_organization && (
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              <span className="truncate">
                                <strong>Org:</strong> {certificate.cert_organization}
                              </span>
                            </div>
                          )}
                          {certificate.cert_country && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span>
                                <strong>País:</strong> {certificate.cert_country}
                              </span>
                            </div>
                          )}
                          {certificate.cert_valid_to && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                <strong>Válido hasta:</strong> {formatCertDate(certificate.cert_valid_to)}
                              </span>
                            </div>
                          )}
                          {certificate.cert_fingerprint_sha256 && (
                            <div className="flex items-center gap-2">
                              <Fingerprint className="h-3 w-3" />
                              <span className="truncate font-mono text-xs">
                                <strong>Huella:</strong> {certificate.cert_fingerprint_sha256.substring(0, 16)}...
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Creado{" "}
                            {formatDistanceToNow(new Date(certificate.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/dashboard/certificates/${certificate.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Button>
                      </Link>
                      {!certificate.is_active && !isExpired && (
                        <Link href={`/dashboard/certificates/${certificate.id}/activate`}>
                          <Button size="sm">Activar</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No tienes certificados digitales</CardTitle>
            <CardDescription>
              Genera o sube tu primer certificado digital para poder firmar documentos de manera segura
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Los certificados digitales te permiten firmar documentos de manera segura y verificable. Puedes generar
              uno nuevo con nuestro sistema o subir uno existente.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/certificates/generate">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generar Certificado
                </Button>
              </Link>
              <Link href="/dashboard/certificates/upload">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Certificado
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
