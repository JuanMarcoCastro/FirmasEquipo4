// Definiciones centralizadas para Roles y Permisos

export const ROLES = ["system_admin", "area_coordinator", "operational_staff", "external_personnel"] as const;
export const PERMISSIONS = [
  "manage_users",
  "manage_roles", // Permiso para gestionar roles y sus permisos
  "upload_documents",
  "sign_documents",
  "view_all_documents",
  "view_area_documents", // Ver documentos del departamento/área
  "manage_area_users", // Gestionar usuarios dentro de su área (para coordinadores)
  "manage_certificates",
  "manage_system_settings",
  // Podrías añadir permisos más granulares si es necesario
  // e.g., "delete_own_documents", "delete_any_document"
] as const;

export type UserRole = (typeof ROLES)[number];
export type Permission = (typeof PERMISSIONS)[number];

export const getRoleText = (role: UserRole): string => {
  switch (role) {
    case "system_admin": return "Administrador del Sistema";
    case "area_coordinator": return "Coordinador de Área";
    case "operational_staff": return "Personal Operativo";
    case "external_personnel": return "Personal Externo";
    default: {
      const exhaustiveCheck: never = role;
      return exhaustiveCheck;
    }
  }
};

export const getPermissionText = (permission: Permission): string => {
  switch (permission) {
    case "manage_users": return "Gestionar Usuarios (Crear, Editar, Eliminar)";
    case "manage_roles": return "Gestionar Roles y Permisos";
    case "upload_documents": return "Subir Nuevos Documentos";
    case "sign_documents": return "Firmar Documentos Asignados";
    case "view_all_documents": return "Ver Todos los Documentos del Sistema";
    case "view_area_documents": return "Ver Documentos de su Área/Departamento";
    case "manage_area_users": return "Gestionar Usuarios de su Área/Departamento";
    case "manage_certificates": return "Gestionar Certificados Digitales (Subir, Revocar)";
    case "manage_system_settings": return "Gestionar Configuración General del Sistema";
    default: {
      const exhaustiveCheck: never = permission;
      return exhaustiveCheck;
    }
  }
};

// Estructura para almacenar los permisos por rol (esto podría venir de una base de datos)
// Para la demo, lo mantenemos simple aquí, pero en `manage-roles/page.tsx` se simula la carga.
export const DEMO_ROLE_PERMISSIONS_CONFIG: Record<UserRole, Permission[]> = {
  system_admin: [...PERMISSIONS], // Admin tiene todos los permisos
  area_coordinator: [
    "upload_documents",
    "sign_documents",
    "view_area_documents",
    "manage_area_users",
  ],
  operational_staff: ["upload_documents", "sign_documents", "view_area_documents"],
  external_personnel: ["sign_documents"],
};
