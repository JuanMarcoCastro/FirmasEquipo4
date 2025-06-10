"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Database, Key, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PreviewPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking")

  useEffect(() => {
    // Verificar conexión a Supabase usando las variables existentes
    const checkSupabase = async () => {
      try {
        const response = await fetch("/api/health")
        if (response.ok) {
          setSupabaseStatus("connected")
        } else {
          setSupabaseStatus("error")
        }
      } catch (error) {
        setSupabaseStatus("error")
      }
    }

    checkSupabase()
  }, [])

  const envVars = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      icon: Globe,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      icon: Key,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Casa Monarca - Preview</h1>
          <p className="text-lg text-gray-600">Sistema de Gestión Documental y Firma Digital</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Supabase Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado de Supabase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {supabaseStatus === "checking" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Verificando conexión...</span>
                  </>
                )}
                {supabaseStatus === "connected" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Conectado
                    </Badge>
                  </>
                )}
                {supabaseStatus === "error" && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">Error de conexión</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Variables de Entorno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {envVars.map((envVar) => (
                  <div key={envVar.name} className="flex items-center gap-2">
                    <envVar.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{envVar.name}:</span>
                    {envVar.value ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Configurada
                      </Badge>
                    ) : (
                      <Badge variant="destructive">No configurada</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/login">
                <Button className="w-full" variant="default">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full" variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Registrarse
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full" variant="secondary">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Versión:</strong> 1.0.0
              </div>
              <div>
                <strong>Framework:</strong> Next.js 14
              </div>
              <div>
                <strong>Base de Datos:</strong> Supabase PostgreSQL
              </div>
              <div>
                <strong>Autenticación:</strong> Supabase Auth
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
