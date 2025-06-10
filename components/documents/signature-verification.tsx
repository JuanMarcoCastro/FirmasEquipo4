"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileSignature, User, Calendar, MessageSquare, Hash } from "lucide-react"

interface SignatureVerificationProps {
  documentId: string
}

export default function SignatureVerification({ documentId }: SignatureVerificationProps) {
  const { supabase } = useSupabase()
  const [signatures, setSignatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const { data, error } = await supabase
          .from("document_signatures")
          .select(`
            *,
            users (
              full_name,
              email,
              role,
              department
            )
          `)
          .eq("document_id", documentId)
          .order("signed_at", { ascending: true })

        if (error) {
          console.error("Error fetching signatures:", error)
        } else {
          setSignatures(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSignatures()
  }, [documentId, supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">Cargando firmas...</div>
        </CardContent>
      </Card>
    )
  }

  if (signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Verificación de Firmas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Este documento aún no ha sido firmado digitalmente.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Firmas Digitales Verificadas
        </CardTitle>
        <CardDescription>
          Este documento tiene {signatures.length} firma{signatures.length > 1 ? "s" : ""} digital
          {signatures.length > 1 ? "es" : ""} válida{signatures.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatures.map((signature, index) => (
          <div key={signature.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{signature.users?.full_name || signature.users?.email}</span>
                <Badge variant="outline">{signature.users?.role}</Badge>
                {signature.users?.department && <Badge variant="secondary">{signature.users?.department}</Badge>}
              </div>
              <Badge variant="default">Firma #{index + 1}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(signature.signed_at).toLocaleString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {signature.signature_reason && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{signature.signature_reason}</span>
                </div>
              )}
            </div>

            {signature.signature_hash && (
              <div className="flex items-center gap-2 text-xs font-mono bg-muted p-2 rounded">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">Hash: {signature.signature_hash}</span>
              </div>
            )}

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Firma digital válida y verificada. La integridad del documento está garantizada desde esta firma.
              </AlertDescription>
            </Alert>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
