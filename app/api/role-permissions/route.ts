import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { clearPermissionsCache } from "@/lib/rbac"

// GET - Obtener todos los permisos de roles
export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que sea system_admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "system_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener permisos
    const { data: permissions, error } = await supabase.from("role_permissions").select("*").order("role, permission")

    if (error) {
      console.error("Error fetching permissions:", error)
      return NextResponse.json({ error: "Error al obtener permisos" }, { status: 500 })
    }

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error in GET /api/role-permissions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Actualizar permisos de un rol
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que sea system_admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "system_admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { role, permission, enabled } = await request.json()

    if (!role || !permission || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Actualizar permiso
    const { error } = await supabase.from("role_permissions").upsert(
      {
        role,
        permission,
        enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "role,permission",
      },
    )

    if (error) {
      console.error("Error updating permission:", error)
      return NextResponse.json({ error: "Error al actualizar permiso" }, { status: 500 })
    }

    // Limpiar cache
    clearPermissionsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/role-permissions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
