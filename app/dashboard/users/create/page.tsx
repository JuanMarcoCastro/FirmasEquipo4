import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import CreateUserForm from "@/components/users/create-user-form"

export default async function CreateUserPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get current user data to check permissions
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Only system admins can access this page
  if (!currentUser || currentUser.role !== "system_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Usuario</h1>
        <p className="text-muted-foreground">Crea un nuevo usuario en el sistema</p>
      </div>
      <CreateUserForm />
    </div>
  )
}
