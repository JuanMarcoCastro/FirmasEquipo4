"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar, User, CheckCircle, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface SignedDocument {
  id: string
  document_id: string
  signature_date: string
  signature_reason: string | null
  signature_position: any
  documents: {
    id: string
    title: string
    description: string | null
    file_path: string
    created_at: string
    users: {
      full_name: string
      email: string
    }
  }
  user_certificates: {
    certificate_name: string
  }
}

export default function SignedDocumentsPage() {
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSignedDocuments() {
      try {
        // Obtener usuario actual
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) return

        setUser(currentUser)

        // Obtener documentos firmados por el usuario actual desde la tabla signatures
        const { data, error } = await supabase
          .from("signatures")
          .select(`
            id,
            document_id,
            signature_date,
            signature_reason,
            signature_position,
            documents (
              id,
              title,
              description,
              file_path,
              created_at,
              users (
                full_name,
                email
              )
            ),
            user_certificates (
              certificate_name
            )
          `)
          .eq("user_id", currentUser.id)
          .order("signature_date", { ascending: false })

        if (error) {
          console.error("Error loading signed documents:", error)
        } else {
          setSignedDocuments(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSignedDocuments()
  }, [supabase])

  const downloadDocument = async (document: SignedDocument) => {
    try {
      // Obtener la URL pública del documento original
      const { data } = supabase.storage.from("documents").getPublicUrl(document.documents.file_path)

      // Abrir en nueva pestaña para descargar
      window.open(data.publicUrl, "_blank")
    } catch (error) {
      console.error("Error downloading document:", error)
      alert("Error al descargar el documento")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos Firmados</h1>
          <p className="text-muted-foreground">Cargando documentos firmados...</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando documentos firmados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos Firmados</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver y descargar todos los documentos que has firmado digitalmente.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Firmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Total de documentos firmados</p>
          </CardContent>
        </Card>
      </div>

      {signedDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">No has firmado documentos aún</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Cuando firmes documentos digitalmente, aparecerán aquí para que puedas consultarlos cuando necesites.
            </p>
            <Link href="/dashboard/sign">
              <Button className="mt-4">
                <FileText className="mr-2 h-4 w-4" />
                Ver documentos para firmar
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {signedDocuments.map((signedDoc) => (
            <Card key={signedDoc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {signedDoc.documents.title}
                    </CardTitle>
                    <CardDescription>{signedDoc.documents.description || "Sin descripción"}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Firmado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Firmado el {format(new Date(signedDoc.signature_date), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Creado por {signedDoc.documents.users.full_name}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Información de la firma:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Certificado: {signedDoc.user_certificates.certificate_name}</p>
                    {signedDoc.signature_position && <p>Posición: Página {signedDoc.signature_position.page || 1}</p>}
                    {signedDoc.signature_reason && <p>Motivo: {signedDoc.signature_reason}</p>}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/documents/${signedDoc.documents.id}`}>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver documento
                    </Button>
                  </Link>
                  <Button onClick={() => downloadDocument(signedDoc)}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
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
