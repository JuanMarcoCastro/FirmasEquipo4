// Role-based access control utilities

export type UserRole = "system_admin" | "area_coordinator" | "operational_staff" | "external_personnel"
export type Permission = "view" | "sign" | "manage" | "create" | "delete" | "admin"

export interface RolePermissions {
  [key: string]: Permission[]
}

// Define permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  system_admin: ["view", "sign", "manage", "create", "delete", "admin"],
  area_coordinator: ["view", "sign", "manage", "create"],
  operational_staff: ["view", "sign"],
  external_personnel: ["view", "sign"],
}

// Check if a user has a specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole].includes(permission)
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

// Check if user can create documents
export function canCreateDocuments(userRole: UserRole): boolean {
  return hasPermission(userRole, "create")
}

// Check if user can delete documents
export function canDeleteDocuments(userRole: UserRole): boolean {
  return hasPermission(userRole, "delete")
}
