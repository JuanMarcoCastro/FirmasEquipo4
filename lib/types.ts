export interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Sub_Admin" | "Management" | "Employer" | "Public"
  avatar?: string
}

export interface File {
  id: string
  name: string
  type: string
  size: string
  date: string
  signed: boolean
  signedBy?: User[]
  pendingSignature?: User[]
  url?: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  files: File[]
  createdBy?: string
  createdAt?: string
}

export interface Notification {
  id: string
  type: "signature_request" | "signature_completed" | "document_uploaded"
  message: string
  read: boolean
  date: string
  userId: string
  documentId?: string
}

export interface Signature {
  id: string
  userId: string
  fileId: string
  date: string
  type: "simple" | "advanced"
  metadata?: Record<string, any>
}
