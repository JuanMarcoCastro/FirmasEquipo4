import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Sistema de Firma Digital</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Bienvenido</h2>
            <p className="text-muted-foreground">Accede a tu dashboard de firmas digitales o crea una nueva cuenta</p>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="space-y-4">
              <Link href="/login" passHref>
                <Button className="w-full">Iniciar Sesión</Button>
              </Link>

              <Link href="/register" passHref>
                <Button variant="outline" className="w-full">
                  Registrarse
                </Button>
              </Link>

              <div className="text-center text-sm text-muted-foreground">
                <p>Sistema seguro de firma digital con encriptación avanzada</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sistema de Firma Digital
        </div>
      </footer>
    </div>
  )
}
