"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ShieldCheck, QrCode, Copy, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import QRCodeGenerator from "@/components/profile/qr-code-generator"

interface TwoFactorSettingsProps {
  user: {
    id: string
    email: string
    totp_enabled: boolean
    totp_secret: string | null
  }
}

export default function TwoFactorSettings({ user }: TwoFactorSettingsProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")

  const generateTOTPSecret = () => {
    // Generate a random base32 secret (equivalent to pyotp.random_base32())
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  const generateTOTPUri = (secret: string, email: string, issuer: string) => {
    // Generate TOTP URI with proper parameters
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: "SHA1",
      digits: "6",
      period: "30",
    })

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params.toString()}`
  }

  const verifyTOTP = async (secret: string, token: string) => {
    try {
      console.log("Verifying TOTP:", { secret: secret.substring(0, 8) + "...", token })

      const response = await fetch("/api/verify-totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          token,
        }),
      })

      const result = await response.json()
      console.log("TOTP verification response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Error al verificar el código")
      }

      return result.valid
    } catch (error) {
      console.error("TOTP verification error:", error)
      throw error
    }
  }

  const handleEnableTOTP = async () => {
    setIsLoading(true)
    try {
      const secret = generateTOTPSecret()
      console.log("Generated TOTP secret:", secret.substring(0, 8) + "...")
      setTotpSecret(secret)
      setShowSetup(true)
      setVerificationStatus("idle")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al generar código",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 6)
    setVerificationCode(cleanValue)
    setVerificationStatus("idle")
  }

  const handleTestCode = async () => {
    if (!totpSecret || !verificationCode || verificationCode.length !== 6) {
      return
    }

    setVerificationStatus("checking")
    try {
      const isValid = await verifyTOTP(totpSecret, verificationCode)
      setVerificationStatus(isValid ? "valid" : "invalid")

      if (isValid) {
        toast({
          title: "Código válido",
          description: "El código es correcto. Puedes proceder a habilitar 2FA.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "El código no es correcto. Verifica que tu aplicación esté sincronizada.",
        })
      }
    } catch (error: any) {
      setVerificationStatus("invalid")
      toast({
        variant: "destructive",
        title: "Error al verificar",
        description: error.message,
      })
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!totpSecret || !verificationCode || verificationStatus !== "valid") {
      toast({
        variant: "destructive",
        title: "Código requerido",
        description: "Por favor verifica que el código sea válido antes de continuar",
      })
      return
    }

    setIsLoading(true)
    try {
      // Double-check the code before saving
      const isValid = await verifyTOTP(totpSecret, verificationCode)

      if (!isValid) {
        throw new Error("Código de verificación inválido")
      }

      // Save TOTP secret to database
      const { error } = await supabase
        .from("users")
        .update({
          totp_enabled: true,
          totp_secret: totpSecret,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "2FA habilitado",
        description: "La autenticación de dos factores ha sido habilitada correctamente.",
      })

      setShowSetup(false)
      setVerificationCode("")
      setVerificationStatus("idle")
      window.location.reload() // Refresh to update user state
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al habilitar 2FA",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableTOTP = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          totp_enabled: false,
          totp_secret: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "2FA deshabilitado",
        description: "La autenticación de dos factores ha sido deshabilitada.",
      })

      window.location.reload()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al deshabilitar 2FA",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret)
      toast({
        title: "Copiado",
        description: "El código secreto ha sido copiado al portapapeles",
      })
    }
  }

  const totpUri = totpSecret ? generateTOTPUri(totpSecret, user.email, "Casa Monarca") : ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticación de Dos Factores (2FA)
        </CardTitle>
        <CardDescription>
          Agrega una capa extra de seguridad a tu cuenta usando una aplicación de autenticación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Estado actual:</span>
            {user.totp_enabled ? (
              <Badge variant="default" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Habilitado
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Deshabilitado
              </Badge>
            )}
          </div>
        </div>

        {!user.totp_enabled && !showSetup && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                La autenticación de dos factores agrega una capa extra de seguridad a tu cuenta. Necesitarás una
                aplicación como Google Authenticator, Authy, Microsoft Authenticator, o similar.
              </AlertDescription>
            </Alert>
            <Button onClick={handleEnableTOTP} disabled={isLoading}>
              <QrCode className="mr-2 h-4 w-4" />
              Habilitar 2FA
            </Button>
          </div>
        )}

        {showSetup && totpSecret && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sigue estos pasos para configurar la autenticación de dos factores. No cierres esta ventana hasta
                completar el proceso.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">Paso 1: Escanea el código QR</h4>
              <p className="text-sm text-muted-foreground">
                Abre tu aplicación de autenticación y escanea este código QR:
              </p>
              <div className="flex justify-center">
                <QRCodeGenerator value={totpUri} size={200} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Paso 2: Código manual (si no puedes escanear)</h4>
              <p className="text-sm text-muted-foreground">Ingresa este código manualmente en tu aplicación:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={totpSecret}
                  readOnly
                  type={showSecret ? "text" : "password"}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Configuración: Algoritmo SHA1, 6 dígitos, 30 segundos</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Paso 3: Verifica el código</h4>
              <p className="text-sm text-muted-foreground">
                Ingresa el código de 6 dígitos que muestra tu aplicación de autenticación:
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => handleVerificationCodeChange(e.target.value)}
                    maxLength={6}
                    className="w-32 text-center text-lg font-mono"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleTestCode}
                    disabled={verificationCode.length !== 6 || verificationStatus === "checking"}
                    variant="outline"
                  >
                    {verificationStatus === "checking" ? "Verificando..." : "Probar Código"}
                  </Button>
                </div>

                {verificationStatus === "valid" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ¡Código válido! Ahora puedes habilitar 2FA.
                    </AlertDescription>
                  </Alert>
                )}

                {verificationStatus === "invalid" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Código inválido. Asegúrate de que tu dispositivo tenga la hora correcta y que hayas configurado la
                      aplicación correctamente.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={isLoading || verificationStatus !== "valid"}
                  className="w-full"
                >
                  {isLoading ? "Habilitando..." : "Habilitar 2FA"}
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => setShowSetup(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        )}

        {user.totp_enabled && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                La autenticación de dos factores está habilitada. Tu cuenta está protegida con una capa adicional de
                seguridad.
              </AlertDescription>
            </Alert>
            <Button variant="destructive" onClick={handleDisableTOTP} disabled={isLoading}>
              Deshabilitar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
