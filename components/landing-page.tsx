import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileSignature, Shield, Users, FileCheck } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Casa Monarca</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Sistema de Gestión de Documentos y Firmas Digitales</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Plataforma segura para la gestión, firma y validación de documentos digitales para Proyecto Casa Monarca.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Comenzar ahora
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Características principales</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Firma Digital Segura</h3>
                <p className="text-gray-600">
                  Firma documentos PDF con certificados digitales personales y validación segura.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Autenticación de Dos Factores</h3>
                <p className="text-gray-600">Protección adicional con autenticación TOTP para mayor seguridad.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Control de Acceso por Roles</h3>
                <p className="text-gray-600">Gestión de permisos basada en roles para diferentes niveles de acceso.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Proyecto Casa Monarca. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
