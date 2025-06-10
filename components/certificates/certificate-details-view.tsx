"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Shield,
  Download,
  Key,
  Calendar,
  Building,
  Globe,
  Mail,
  User,
  Fingerprint,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Hash,
} from "lucide-react"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CertificateDetailsViewProps {
  certificate: {
    id: string
    certificate_name: string
    created_at: string
    is_active: boolean
    certificate_storage_path?: string
    private_key_storage_path?: string
    cert_common_name?: string
    cert_email?: string
    cert_organization?: string
    cert_organizational_unit?: string
    cert_country?: string
    cert_serial_number?: string
    cert_valid_from?: string
    cert_valid_to?: string
    cert_issuer_common_name?: string
    cert_fingerprint_sha256?: string
  }
  signedDocuments: Array<{
    id: string
    signed_at: string
    signature_reason?: string
    documents: {
      id: string
      title: string
      description?: string
      file_path: string
    }
  }>
  userId: string
}

export function CertificateDetailsView({ certificate, signedDocuments, userId }: CertificateDetailsViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  // Helper functions
  const formatCertDate = (dateString?: string) => {
    if (!dateString) return "No disponible"
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return dateString
    }
  }

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch {
      return dateString
    }
  }

  const isCertificateExpired = () => {
    if (!certificate.cert_valid_to) return false
    try {
      return new Date(certificate.cert_valid_to) < new Date()
    } catch {
      return false
    }
  }

  const getCertificateStatus = () => {
    const isExpired = isCertificateExpired()
    if (isExpired) return { status: "expired", label: "Expirado", variant: "destructive" as const }
    if (certificate.is_active) return { status: "active", label: "Activo", variant: "secondary" as const }
    return { status: "inactive", label: "Inactivo", variant: "outline" as const }
  }

  const downloadCertificate = async () => {
    if (!certificate.certificate_storage_path) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontró la ruta del certificado",
      })
      return
    }

    setIsDownloading(true)
    try {
      // This would need to be implemented as an API endpoint that securely serves the certificate
      const response = await fetch(`/api/download-certificate/${certificate.id}`)
      if (!response.ok) throw new Error("Error al descargar certificado")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${certificate.certificate_name}.pem`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Certificado descargado",
        description: "El certificado se ha descargado exitosamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al descargar",
        description: "No se pudo descargar el certificado",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const statusInfo = getCertificateStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/certificates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Certificados
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{certificate.certificate_name}</h1>
            <p className="text-muted-foreground">Detalles del certificado digital</p>
          </div>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm">
          {statusInfo.status === "expired" && <AlertTriangle className="mr-1 h-3 w-3" />}
          {statusInfo.status === "active" && <CheckCircle className="mr-1 h-3 w-3" />}
          {statusInfo.label}
        </Badge>
      </div>

      {/* Status Alert */}
      {statusInfo.status === "expired" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este certificado ha expirado y no puede ser usado para firmar documentos. Considera generar un nuevo
            certificado.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Certificate Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha de creación</span>
                  </div>
                  <p className="font-medium">{formatCertDate(certificate.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Creado hace</span>
                  </div>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(certificate.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Detalles del Certificado X.509
              </CardTitle>
              <CardDescription>Información extraída del certificado digital generado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Información del Titular
                  </h4>

                  {certificate.cert_common_name && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Nombre Común (CN)</span>
                      </div>
                      <p className="font-medium">{certificate.cert_common_name}</p>
                    </div>
                  )}

                  {certificate.cert_email && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>Dirección de Email</span>
                      </div>
                      <p className="font-medium">{certificate.cert_email}</p>
                    </div>
                  )}

                  {certificate.cert_organization && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>Organización (O)</span>
                      </div>
                      <p className="font-medium">{certificate.cert_organization}</p>
                    </div>
                  )}

                  {certificate.cert_organizational_unit && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>Unidad Organizacional (OU)</span>
                      </div>
                      <p className="font-medium">{certificate.cert_organizational_unit}</p>
                    </div>
                  )}

                  {certificate.cert_country && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>País (C)</span>
                      </div>
                      <p className="font-medium">{certificate.cert_country}</p>
                    </div>
                  )}
                </div>

                {/* Technical Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Información Técnica
                  </h4>

                  {certificate.cert_serial_number && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Número de Serie</span>
                      </div>
                      <p className="font-mono text-sm break-all">{certificate.cert_serial_number}</p>
                    </div>
                  )}

                  {certificate.cert_valid_from && certificate.cert_valid_to && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Período de Validez</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <strong>Desde:</strong> {formatShortDate(certificate.cert_valid_from)}
                        </p>
                        <p className="text-sm">
                          <strong>Hasta:</strong> {formatShortDate(certificate.cert_valid_to)}
                        </p>
                      </div>
                    </div>
                  )}

                  {certificate.cert_issuer_common_name && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Emisor</span>
                      </div>
                      <p className="font-medium">{certificate.cert_issuer_common_name}</p>
                    </div>
                  )}

                  {certificate.cert_fingerprint_sha256 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Fingerprint className="h-4 w-4" />
                        <span>Huella Digital SHA256</span>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                        {certificate.cert_fingerprint_sha256}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={downloadCertificate}
                disabled={isDownloading || !certificate.certificate_storage_path}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Descargando..." : "Descargar Certificado"}
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/sign">
                  <FileText className="mr-2 h-4 w-4" />
                  Firmar Documentos
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{signedDocuments.length}</div>
                <p className="text-sm text-muted-foreground">Documentos firmados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signed Documents */}
      {signedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Firmados con este Certificado
            </CardTitle>
            <CardDescription>Lista de documentos que has firmado usando este certificado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.documents.title}</h4>
                    {doc.documents.description && (
                      <p className="text-sm text-muted-foreground">{doc.documents.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Firmado el {formatShortDate(doc.signed_at)}</span>
                      {doc.signature_reason && <span>• {doc.signature_reason}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/documents/${doc.documents.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
