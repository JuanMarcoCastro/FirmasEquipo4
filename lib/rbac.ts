// Role-based access control utilities

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export type UserRole = "system_admin" | "area_coordinator" | "operational_staff" | "external_personnel"
export type Permission = "view" | "sign" | "manage" | "create" | "delete" | "admin"

export interface RolePermissions {
  [key: string]: Permission[]
}

// Permisos por defecto (fallback si no hay datos en BD)
export const defaultRolePermissions: Record<UserRole, Permission[]> = {
  system_admin: ["view", "sign", "manage", "create", "delete", "admin"],
  area_coordinator: ["view", "sign", "manage", "create"],
  operational_staff: ["view", "sign"],
  external_personnel: ["view", "sign"],
}

// Cache para permisos
let permissionsCache: Record<UserRole, Permission[]> | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Obtener permisos de la base de datos
export async function getRolePermissionsFromDB(): Promise<Record<UserRole, Permission[]>> {
  // Verificar cache
  const now = Date.now()
  if (permissionsCache && now - cacheTimestamp < CACHE_DURATION) {
    return permissionsCache
  }

  try {
    const supabase = createClientComponentClient()
    const { data: permissions, error } = await supabase
      .from("role_permissions")
      .select("role, permission, enabled")
      .eq("enabled", true)

    if (error) {
      console.error("Error fetching role permissions:", error)
      return defaultRolePermissions
    }

    // Construir objeto de permisos
    const rolePermissions: Record<string, Permission[]> = {}

    permissions?.forEach(({ role, permission }) => {
      if (!rolePermissions[role]) {
        rolePermissions[role] = []
      }
      rolePermissions[role].push(permission as Permission)
    })

    // Asegurar que todos los roles tengan al menos los permisos por defecto
    const result: Record<UserRole, Permission[]> = {
      system_admin: rolePermissions.system_admin || defaultRolePermissions.system_admin,
      area_coordinator: rolePermissions.area_coordinator || defaultRolePermissions.area_coordinator,
      operational_staff: rolePermissions.operational_staff || defaultRolePermissions.operational_staff,
      external_personnel: rolePermissions.external_personnel || defaultRolePermissions.external_personnel,
    }

    // Actualizar cache
    permissionsCache = result
    cacheTimestamp = now

    return result
  } catch (error) {
    console.error("Error in getRolePermissionsFromDB:", error)
    return defaultRolePermissions
  }
}

// Limpiar cache (útil después de actualizar permisos)
export function clearPermissionsCache() {
  permissionsCache = null
  cacheTimestamp = 0
}

// Check if a user has a specific permission
export async function hasPermission(userRole: UserRole, permission: Permission): Promise<boolean> {
  const rolePermissions = await getRolePermissionsFromDB()
  return rolePermissions[userRole]?.includes(permission) || false
}

// Versión síncrona usando permisos por defecto (para compatibilidad)
export function hasPermissionSync(userRole: UserRole, permission: Permission): boolean {
  return defaultRolePermissions[userRole].includes(permission)
}

// Check if user can access a document based on role and department
export function canAccessDocument(
  userRole: UserRole,
  userDepartment: string | null,
  documentDepartment: string | null,
  permissionType: "view" | "sign" | "manage",
): boolean {
  // System admins can access everything
  if (userRole === "system_admin") {
    return true
  }

  // Area coordinators can access documents from their department and manage cross-department documents
  if (userRole === "area_coordinator") {
    if (permissionType === "manage") {
      return userDepartment === documentDepartment
    }
    return true // Can view and sign documents from other departments
  }

  // Operational staff can only access documents from their department
  if (userRole === "operational_staff") {
    return userDepartment === documentDepartment
  }

  // External personnel can only access documents they're explicitly given permission to
  if (userRole === "external_personnel") {
    return false // Must be explicitly granted permission through document_permissions table
  }

  return false
}

// Check if user can manage other users
export function canManageUsers(
  userRole: UserRole,
  targetUserRole: UserRole,
  userDepartment: string | null,
  targetUserDepartment: string | null,
): boolean {
  // System admins can manage everyone
  if (userRole === "system_admin") {
    return true
  }

  // Area coordinators can manage operational staff and external personnel in their department
  if (userRole === "area_coordinator") {
    if (targetUserRole === "system_admin" || targetUserRole === "area_coordinator") {
      return false
    }
    return userDepartment === targetUserDepartment
  }

  return false
}

// Get role display text
export function getRoleDisplayText(role: UserRole): string {
  const roleTexts = {
    system_admin: "Administrador del Sistema",
    area_coordinator: "Coordinador de Área",
    operational_staff: "Personal Operativo",
    external_personnel: "Personal Externo",
  }
  return roleTexts[role]
}

// Get permission display text
export function getPermissionDisplayText(permission: Permission): string {
  const permissionTexts = {
    view: "Ver",
    sign: "Firmar",
    manage: "Gestionar",
    create: "Crear",
    delete: "Eliminar",
    admin: "Administrar",
  }
  return permissionTexts[permission]
}

// Get available departments
export const departments = [
  "Humanitaria",
  "Psicosocial",
  "Legal",
  "Comunicación",
  "Almacén",
  "Administración",
  "Tecnología",
  "Consultoría Externa",
  "Auditoría Externa",
  "Proveedor Servicios",
]

// Get all available permissions
export const allPermissions: Permission[] = ["view", "sign", "manage", "create", "delete", "admin"]

// Get all available roles
export const allRoles: UserRole[] = ["system_admin", "area_coordinator", "operational_staff", "external_personnel"]

// Check if user can create documents
export async function canCreateDocuments(userRole: UserRole): Promise<boolean> {
  return await hasPermission(userRole, "create")
}

// Check if user can delete documents
export async function canDeleteDocuments(userRole: UserRole): Promise<boolean> {
  return await hasPermission(userRole, "delete")
}
