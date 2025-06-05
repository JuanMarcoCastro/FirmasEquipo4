export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      document_permissions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          permission_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          permission_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          permission_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          id: string
          requires_signatures: number
          signature_count: number
          status: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          id?: string
          requires_signatures?: number
          signature_count?: number
          status?: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          id?: string
          requires_signatures?: number
          signature_count?: number
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          certificate_id: string
          created_at: string
          document_id: string
          id: string
          signature_date: string
          signature_hash: string | null
          signature_position: Json | null
          signature_reason: string | null
          user_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          document_id: string
          id?: string
          signature_date?: string
          signature_hash?: string | null
          signature_position?: Json | null
          signature_reason?: string | null
          user_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          document_id?: string
          id?: string
          signature_date?: string
          signature_hash?: string | null
          signature_position?: Json | null
          signature_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "user_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certificates: {
        Row: {
          certificate_name: string
          certificate_reference: string
          created_at: string
          id: string
          is_active: boolean
          private_key_reference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_name: string
          certificate_reference: string
          created_at?: string
          id?: string
          is_active?: boolean
          private_key_reference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_name?: string
          certificate_reference?: string
          created_at?: string
          id?: string
          is_active?: boolean
          private_key_reference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          role: string
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          role: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
