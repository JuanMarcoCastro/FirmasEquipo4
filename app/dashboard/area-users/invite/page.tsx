import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import InviteUserForm from "@/components/users/invite-user-form"

export default async function InviteUserPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get current user data to check permissions
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Only area coordinators can access this page
  if (!currentUser || currentUser.role !== "area_coordinator") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invitar Usuario</h1>
        <p className="text-muted-foreground">Invita a un nuevo usuario a tu área: {currentUser.department}</p>
      </div>
      <InviteUserForm coordinatorDepartment={currentUser.department} />
    </div>
  )
}
