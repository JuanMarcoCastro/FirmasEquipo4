"use client"

import { useState, useEffect } from "react"

type UserRole = "Admin" | "Sub_Admin" | "Management" | "Employer" | "Public"

export function useUserRole() {
  // En una implementación real, esto vendría de un contexto de autenticación
  // o de una llamada a la API para obtener el usuario actual
  const [role, setRole] = useState<UserRole>("Admin")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulamos la carga del rol del usuario
    const loadUserRole = async () => {
      try {
        // En una implementación real, aquí obtendrías el rol del usuario desde la API
        // const response = await fetch('/api/me')
        // const data = await response.json()
        // setRole(data.role)

        // Para pruebas, puedes cambiar este valor para simular diferentes roles:
        // "Admin", "Sub_Admin", "Management", "Employer", "Public"
        setRole("Admin")
      } catch (error) {
        console.error("Error al cargar el rol del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserRole()
  }, [])

  // Funciones de utilidad para comprobar permisos
  const canManageUsers = role === "Admin" || role === "Sub_Admin" || role === "Management"
  const canManagePermissions = role === "Admin"
  const canManageCloudStorage = role === "Admin" || role === "Sub_Admin"
  const canCreateFolders = role === "Admin" || role === "Sub_Admin" || role === "Management"

  return {
    role,
    isLoading,
    canManageUsers,
    canManagePermissions,
    canManageCloudStorage,
    canCreateFolders,
  }
}
