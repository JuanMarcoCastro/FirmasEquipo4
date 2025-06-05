import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard/dashboard-nav"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      redirect("/login")
    }

    if (!session) {
      redirect("/login")
    }

    // Get user data with better error handling and retry logic
    let userData = null
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts && !userData) {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle()

        if (error) {
          console.error(`Attempt ${attempts + 1} - Error fetching user data:`, error)
          if (attempts === maxAttempts - 1) {
            throw error
          }
          attempts++
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }

        userData = data
        break
      } catch (err) {
        console.error(`Attempt ${attempts + 1} failed:`, err)
        attempts++
        if (attempts >= maxAttempts) {
          throw err
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!userData) {
      // If user data doesn't exist, create it with default values
      try {
        const { error: insertError } = await supabase.from("users").insert({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.email!.split("@")[0],
          role: "external_personnel", // Default role
          department: "Sin asignar",
          totp_enabled: false,
        })

        if (insertError) {
          console.error("Error creating user profile:", insertError)
          // Instead of redirecting, create a minimal user object
          userData = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.email!.split("@")[0],
            role: "external_personnel",
            department: "Sin asignar",
            totp_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        } else {
          // Fetch the newly created user
          const { data: newUserData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          userData = newUserData || {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.email!.split("@")[0],
            role: "external_personnel",
            department: "Sin asignar",
            totp_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      } catch (createError) {
        console.error("Error in user creation process:", createError)
        // Create a fallback user object
        userData = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.email!.split("@")[0],
          role: "external_personnel",
          department: "Sin asignar",
          totp_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    }

    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader user={userData} />
        <div className="flex flex-1">
          <DashboardNav role={userData.role} department={userData.department} />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard layout error:", error)
    // Redirect to login on any critical error
    redirect("/login")
  }
}
