import { createServerClient } from "@/lib/supabase-server"
import LandingPage from "@/components/landing-page"
import { redirect } from "next/navigation"

// Función separada para verificar sesión
async function checkSession() {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getSession()

  if (!error && data.session) {
    return true
  }

  return false
}

export default async function Home() {
  // Verificar si hay sesión activa
  const hasSession = await checkSession()

  // Redireccionar si hay sesión
  if (hasSession) {
    redirect("/dashboard")
  }

  // Si no hay sesión, mostrar landing page
  return <LandingPage />
}
