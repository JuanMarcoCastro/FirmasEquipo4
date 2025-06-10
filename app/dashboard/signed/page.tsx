"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Calendar,
  User,
  CheckCircle,
  ExternalLink,
  FileCheck,
  Building,
  Mail,
  Globe,
  Key,
  ShieldAlert,
  Clock,
  Fingerprint,
  Loader2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UserCertificateDetails {
  certificate_name: string
  cert_common_name?: string
  cert_email?: string
  cert_organization?: string
  cert_organizational_unit?: string
  cert_country?: string
  cert_serial_number?: string
  cert_valid_from?: string // ISO date string
  cert_valid_to?: string // ISO date string
  cert_issuer_common_name?: string
  cert_fingerprint_sha256?: string
}

interface SignedDocument {
  id: string
  document_id: string
  signature_date: string // Esta es la fecha de la firma en sí
  signature_reason: string | null
  signature_position: any
  documents: {
    id: string
    title: string
    description: string | null
    file_path: string
    created_at: string
    users: {
      // Usuario que SUBIÓ el documento
      full_name: string
      email: string
    }
  }
  user_certificates?: UserCertificateDetails // Certificado usado para ESTA firma
  // Información del usuario que realizó la firma (podría ser diferente al que subió el doc)
  signed_by_user?: {
    full_name: string
    email: string
    department?: string
  }
}

export default function SignedDocumentsPage() {
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSignedDocuments() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw new Error(`Error obteniendo usuario: ${userError.message}`)
        if (!user) throw new Error("No se encontró usuario autenticado")
        setCurrentUser(user)

        // Consulta para firmas de la tabla 'signatures' (sistema antiguo/general)
        const { data: signaturesData, error: signaturesError } = await supabase
          .from("signatures")
          .select(`
            id,
            document_id,
            signature_date,
            signature_reason,
            signature_position,
            documents (id, title, description, file_path, created_at, users (full_name, email)),
            user_certificates (
              certificate_name, cert_common_name, cert_email, cert_organization, 
              cert_organizational_unit, cert_country, cert_serial_number, 
              cert_valid_from, cert_valid_to, cert_issuer_common_name, cert_fingerprint_sha256
            ),
            users!signatures_user_id_fkey (full_name, email, department)
          `)
          .eq("user_id", user.id)
          .order("signature_date", { ascending: false })

        if (signaturesError) throw new Error(`Error cargando firmas (tabla signatures): ${signaturesError.message}`)

        // Consulta para firmas de la tabla 'document_signatures' (PyHanko)
        const { data: pyhankoSignaturesData, error: pyhankoError } = await supabase
          .from("document_signatures")
          .select(`
            id,
            document_id,
            signed_at,
            signature_reason,
            signature_position,
            documents (id, title, description, file_path, created_at, users (full_name, email)),
            user_certificates (
              certificate_name, cert_common_name, cert_email, cert_organization, 
              cert_organizational_unit, cert_country, cert_serial_number, 
              cert_valid_from, cert_valid_to, cert_issuer_common_name, cert_fingerprint_sha256
            ),
            users!document_signatures_user_id_fkey (full_name, email, department)
          `)
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })

        if (pyhankoError)
          console.error("Error cargando firmas PyHanko (tabla document_signatures):", pyhankoError.message)

        let combinedSignatures: SignedDocument[] = []

        if (signaturesData) {
          combinedSignatures = combinedSignatures.concat(
            signaturesData.map((s) => ({
              ...s,
              signed_by_user: s.users as any, // Renombrar para claridad
            })),
          )
        }

        if (pyhankoSignaturesData) {
          const formattedPyhanko = pyhankoSignaturesData.map((sig) => ({
            ...sig,
            signature_date: sig.signed_at, // Normalizar fecha
            // Si user_certificates es null (porque no hay un ID de certificado vinculado en document_signatures),
            // creamos un objeto placeholder.
            user_certificates: sig.user_certificates
              ? (sig.user_certificates as UserCertificateDetails)
              : {
                  certificate_name: "Certificado del Sistema (PyHanko)",
                  cert_common_name: (sig.users as any)?.full_name || user.email,
                  cert_email: (sig.users as any)?.email || user.email,
                  cert_organization: "Casa Monarca",
                  cert_organizational_unit: (sig.users as any)?.department || "General",
                  cert_country: "MX",
                },
            signed_by_user: sig.users as any, // Renombrar para claridad
          }))
          combinedSignatures = combinedSignatures.concat(formattedPyhanko)
        }

        combinedSignatures.sort((a, b) => new Date(b.signature_date).getTime() - new Date(a.signature_date).getTime())
        setSignedDocuments(combinedSignatures)
      } catch (err) {
        console.error("Error detallado en loadSignedDocuments:", err)
        setError(err instanceof Error ? err.message : "Error desconocido cargando documentos firmados")
      } finally {
        setLoading(false)
      }
    }
    loadSignedDocuments()
  }, [supabase])

  const downloadDocument = async (documentPath: string) => {
    try {
      const { data } = supabase.storage.from("documents").getPublicUrl(documentPath)
      window.open(data.publicUrl, "_blank")
    } catch (error) {
      console.error("Error downloading document:", error)
      alert("Error al descargar el documento.")
    }
  }

  // Helper para formatear fechas de certificado
  const formatDateCert = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch {
      return dateString // Devuelve el string original si no se puede parsear
    }
  }

  if (loading) {
    /* ... UI de carga ... */
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mis Documentos Firmados</h1>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  if (error) {
    /* ... UI de error ... */
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mis Documentos Firmados</h1>
          <p className="text-sm text-muted-foreground">Error</p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Error al Cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mis Documentos Firmados</h1>
        <p className="text-sm text-muted-foreground">Documentos que has firmado digitalmente.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Total Firmados por Mí</CardTitle>
          <FileCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{signedDocuments.length}</div>
        </CardContent>
      </Card>

      {signedDocuments.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aún no has firmado documentos</h3>
            <p className="text-muted-foreground mb-6">Cuando firmes documentos, aparecerán aquí.</p>
            <Button asChild>
              <Link href="/dashboard/sign">
                <FileText className="mr-2 h-4 w-4" />
                Ver documentos para firmar
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 mt-6">
          {signedDocuments.map((signedDoc) => (
            <Card key={signedDoc.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div className="flex-grow">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="truncate" title={signedDoc.documents.title}>
                        {signedDoc.documents.title}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {signedDoc.documents.description || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1 self-start sm:self-center"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Firmado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Firmado el: {format(new Date(signedDoc.signature_date), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Subido por: {signedDoc.documents.users.full_name}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-xs mb-2 text-slate-700 dark:text-slate-300">
                    Detalles de Esta Firma:
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Firmado por:</strong>{" "}
                        {signedDoc.signed_by_user?.full_name ||
                          currentUser?.user_metadata?.full_name ||
                          "Usuario Actual"}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Email (Firmante):</strong>{" "}
                        {signedDoc.signed_by_user?.email || currentUser?.email || "No disponible"}
                      </div>
                    </div>

                    {signedDoc.user_certificates ? (
                      <>
                        <div className="flex items-start gap-2">
                          <Key className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>Certificado:</strong> {signedDoc.user_certificates.certificate_name}
                          </div>
                        </div>
                        {signedDoc.user_certificates.cert_common_name && (
                          <div className="flex items-start gap-2">
                            <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>CN (Cert):</strong> {signedDoc.user_certificates.cert_common_name}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_email && (
                          <div className="flex items-start gap-2">
                            <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Email (Cert):</strong> {signedDoc.user_certificates.cert_email}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_organization && (
                          <div className="flex items-start gap-2">
                            <Building className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Org (Cert):</strong> {signedDoc.user_certificates.cert_organization}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_organizational_unit && (
                          <div className="flex items-start gap-2">
                            <Building className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>OU (Cert):</strong> {signedDoc.user_certificates.cert_organizational_unit}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_country && (
                          <div className="flex items-start gap-2">
                            <Globe className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>País (Cert):</strong> {signedDoc.user_certificates.cert_country}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_fingerprint_sha256 && (
                          <div className="flex items-start gap-2">
                            <Fingerprint className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Huella SHA256:</strong>{" "}
                              <span className="font-mono break-all">
                                {signedDoc.user_certificates.cert_fingerprint_sha256}
                              </span>
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_valid_from && signedDoc.user_certificates.cert_valid_to && (
                          <div className="flex items-start gap-2">
                            <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Validez (Cert):</strong>{" "}
                              {formatDateCert(signedDoc.user_certificates.cert_valid_from)} -{" "}
                              {formatDateCert(signedDoc.user_certificates.cert_valid_to)}
                            </div>
                          </div>
                        )}
                        {signedDoc.user_certificates.cert_issuer_common_name && (
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Emisor (Cert):</strong> {signedDoc.user_certificates.cert_issuer_common_name}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        <Key className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Certificado:</strong> No especificado
                        </div>
                      </div>
                    )}
                    {signedDoc.signature_reason && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Motivo Firma:</strong> {signedDoc.signature_reason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <Button variant="outline" size="sm" asChild className="flex-grow sm:flex-grow-0">
                    <Link href={`/dashboard/sign/${signedDoc.documents.id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver y Verificar Firma
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadDocument(signedDoc.documents.file_path)}
                    className="flex-grow sm:flex-grow-0"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
