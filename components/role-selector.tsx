"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUserRole } from "@/hooks/use-user-role"

// Este componente es útil para pruebas - permite cambiar el rol del usuario actual
export function RoleSelector() {
  const { role } = useUserRole()
  const [currentRole, setCurrentRole] = useState(role)

  const handleRoleChange = (newRole: string) => {
    // En una implementación real, esto actualizaría el contexto de autenticación
    // o haría una llamada a la API para cambiar el rol del usuario
    setCurrentRole(newRole)
    window.location.reload() // Recargar para aplicar los cambios
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Rol: {currentRole}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleRoleChange("Admin")}>Admin (Nivel 1)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("Sub_Admin")}>Sub_Admin (Nivel 2)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("Management")}>Management (Nivel 3)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("Employer")}>Employer (Nivel 4)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("Public")}>Public (Nivel 4)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
