-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.document_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  permission_type text NOT NULL CHECK (permission_type = ANY (ARRAY['view'::text, 'sign'::text, 'manage'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT document_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_review'::text, 'signed'::text, 'rejected'::text, 'archived'::text])),
  signature_count integer DEFAULT 0,
  requires_signatures integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  certificate_id uuid NOT NULL,
  signature_position jsonb,
  signature_date timestamp with time zone DEFAULT now(),
  signature_reason text,
  signature_hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT signatures_pkey PRIMARY KEY (id),
  CONSTRAINT signatures_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.user_certificates(id),
  CONSTRAINT signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT signatures_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.user_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certificate_name text NOT NULL,
  certificate_reference text NOT NULL,
  private_key_reference text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_certificates_pkey PRIMARY KEY (id),
  CONSTRAINT user_certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['system_admin'::text, 'area_coordinator'::text, 'operational_staff'::text, 'external_personnel'::text])),
  department text,
  totp_enabled boolean DEFAULT false,
  totp_secret text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);