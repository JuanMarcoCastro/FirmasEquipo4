import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Iniciar sesión</h1>
          <p className="mt-2 text-gray-600">Ingresa a tu cuenta para acceder al sistema</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
