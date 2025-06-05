"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Upload, Loader2 } from "lucide-react"

interface Certificate {
  id: string
  certificate_name: string
  is_active: boolean
}

interface CertificateSelectorProps {
  userId: string
  onSelect: (certificateId: string, password: string) => void
  onCancel: () => void
}

export default function CertificateSelector({ userId, onSelect, onCancel }: CertificateSelectorProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const { data, error } = await supabase
          .from("user_certificates")
          .select("id, certificate_name, is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setCertificates(data || [])
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error al cargar certificados",
          description: error.message || "No se pudieron cargar los certificados",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [supabase, userId, toast])

  const handleSubmit = () => {
    if (!selectedCertificate) {
      toast({
        variant: "destructive",
        title: "Selecciona un certificado",
        description: "Debes seleccionar un certificado para continuar",
      })
      return
    }

    if (!password) {
      toast({
        variant: "destructive",
        title: "Ingresa la contraseña",
        description: "Debes ingresar la contraseña de tu certificado",
      })
      return
    }

    onSelect(selectedCertificate, password)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Selecciona tu certificado digital</CardTitle>
        <CardDescription>Elige el certificado que deseas utilizar para firmar este documento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : certificates.length > 0 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificado</Label>
              <Select value={selectedCertificate} onValueChange={setSelectedCertificate}>
                <SelectTrigger id="certificate">
                  <SelectValue placeholder="Selecciona un certificado" />
                </SelectTrigger>
                <SelectContent>
                  {certificates.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id}>
                      {cert.certificate_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña del certificado</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa la contraseña de tu certificado"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No tienes certificados registrados</p>
              <p className="text-sm text-muted-foreground">
                Debes subir un certificado digital para poder firmar documentos
              </p>
            </div>
            <Button variant="outline" className="mt-2">
              <Upload className="mr-2 h-4 w-4" />
              Subir certificado
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!selectedCertificate || !password || certificates.length === 0}>
          Continuar
        </Button>
      </CardFooter>
    </Card>
  )
}
