"use client"

import Link from "next/link"
import Image from "next/image" // Importar Image de next/image
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, CheckCircle } from "lucide-react" // Eliminar FileText de las importaciones

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image src="/Casa_monarca.png" alt="Casa Monarca Logo" width={80} height={80} className="h-22 w-22 mr-3 text-primary" /> {/* Ajustar h- y w- para que coincidan con height y width */}
              <h1 className="text-2xl font-bold text-gray-900">Casa Monarca ayuda humanitaria al migrante A. B. P.</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Sistema de Gestión de
            <span className="text-blue-600"> Documentos Digitales</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Plataforma segura para la gestión, firma digital y verificación de documentos para Casa Monarca ayuda
            humanitaria al migrante A. B. P.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/register">
                <Button size="lg" className="w-full">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-600 mr-3" />
                  <CardTitle>Firma Digital Segura</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Firma documentos con certificados digitales seguros y verificables locales. Pudiera cumplir con estándares
                  internacionales de seguridad.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600 mr-3" />
                  <CardTitle>Gestión de Usuarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sistema de roles y permisos granular. Controla quién puede ver, editar y firmar cada documento.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                  <CardTitle>Verificación Completa</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Verifica la autenticidad e integridad de documentos firmados. Rastrea todas las firmas y
                  modificaciones.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-blue-600 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="text-center">
              <h3 className="text-3xl font-extrabold text-white">¿Listo para digitalizar tu gestión documental?</h3>
              <p className="mt-4 text-lg text-blue-100">
                Únete a Casa Monarca y comienza a gestionar tus documentos de forma segura y eficiente.
              </p>
              <div className="mt-8">
                <Link href="/register">
                  <Button size="lg" variant="secondary">
                    Crear Cuenta Gratuita
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Casa Monarca ayuda humanitaria al migrante A. B. P. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
