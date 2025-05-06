import type { Folder, File, User, Notification } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin Usuario",
    email: "admin@example.com",
    role: "Admin",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Gerente Uno",
    email: "gerente@example.com",
    role: "Management",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Empleado Uno",
    email: "empleado@example.com",
    role: "Employer",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Sub Admin",
    email: "subadmin@example.com",
    role: "Sub_Admin",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Usuario Público",
    email: "publico@example.com",
    role: "Public",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export const mockFiles: File[] = [
  {
    id: "1",
    name: "Contrato-2023.pdf",
    type: "application/pdf",
    size: "2.4 MB",
    date: "2023-05-15",
    signed: true,
    signedBy: [mockUsers[0]],
  },
  {
    id: "2",
    name: "Presupuesto-Q2.pdf",
    type: "application/pdf",
    size: "1.8 MB",
    date: "2023-06-01",
    signed: false,
    pendingSignature: [mockUsers[1]],
  },
  {
    id: "3",
    name: "Reporte-Mensual.pdf",
    type: "application/pdf",
    size: "3.2 MB",
    date: "2023-06-10",
    signed: false,
    pendingSignature: [mockUsers[0], mockUsers[1]],
  },
  {
    id: "4",
    name: "Acuerdo-Confidencialidad.pdf",
    type: "application/pdf",
    size: "1.1 MB",
    date: "2023-05-20",
    signed: true,
    signedBy: [mockUsers[0], mockUsers[1], mockUsers[2]],
  },
]

export const mockFolders: Folder[] = [
  {
    id: "root",
    name: "Raíz",
    parentId: null,
    files: [],
  },
  {
    id: "1",
    name: "Contratos",
    parentId: "root",
    files: [mockFiles[0], mockFiles[3]],
  },
  {
    id: "2",
    name: "Finanzas",
    parentId: "root",
    files: [mockFiles[1]],
  },
  {
    id: "3",
    name: "Reportes",
    parentId: "root",
    files: [mockFiles[2]],
  },
  {
    id: "4",
    name: "Contratos 2023",
    parentId: "1",
    files: [],
  },
  {
    id: "5",
    name: "Contratos 2022",
    parentId: "1",
    files: [],
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "signature_request",
    message: "Se requiere tu firma en el documento Presupuesto-Q2.pdf",
    read: false,
    date: "2023-06-02",
    userId: "1",
    documentId: "2",
  },
  {
    id: "2",
    type: "signature_completed",
    message: "El documento Contrato-2023.pdf ha sido firmado por todos los participantes",
    read: true,
    date: "2023-05-16",
    userId: "1",
    documentId: "1",
  },
  {
    id: "3",
    type: "document_uploaded",
    message: "Se ha subido un nuevo documento: Reporte-Mensual.pdf",
    read: false,
    date: "2023-06-10",
    userId: "1",
    documentId: "3",
  },
]
