-- Complete RLS fix to eliminate infinite recursion
-- This script will completely rebuild the RLS policies with a non-recursive approach

-- First, disable RLS on all tables to clear any existing policies
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all access for system admins on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to view documents they have permission for" ON public.documents;
DROP POLICY IF EXISTS "Allow insert for authenticated users on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow update for owners or admins on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow delete for owners or admins on documents" ON public.documents;

DROP POLICY IF EXISTS "Allow all access for system admins on document_permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Allow document owner or manager to manage permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Allow users to view their own permissions" ON public.document_permissions;

DROP POLICY IF EXISTS "Allow system admins to manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

DROP POLICY IF EXISTS "Allow system admins full access to signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users to view their own signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users with view/sign/manage permission on document to see signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users with sign permission to insert their signature" ON public.document_signatures;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_system_admin();
DROP FUNCTION IF EXISTS is_document_owner(UUID);
DROP FUNCTION IF EXISTS has_document_permission(UUID, TEXT);

-- Create simplified helper functions that avoid recursion
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without RLS to avoid recursion
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'system_admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Simple function to check document ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_document_owner(doc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  owner_id UUID;
BEGIN
  -- Direct query without RLS to avoid recursion
  SELECT uploaded_by INTO owner_id FROM public.documents WHERE id = doc_id;
  RETURN COALESCE(owner_id = auth.uid(), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check permissions without causing recursion
CREATE OR REPLACE FUNCTION public.user_has_permission(doc_id UUID, perm_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct query to document_permissions without RLS
  RETURN EXISTS (
    SELECT 1 FROM public.document_permissions 
    WHERE document_id = doc_id 
    AND user_id = auth.uid() 
    AND permission_type = perm_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_document_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, TEXT) TO authenticated;

-- Enable RLS on users table first (no dependencies)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_admin_all" ON public.users
FOR ALL USING (public.is_system_admin());

CREATE POLICY "users_own_select" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_own_update" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on document_permissions (depends only on users via functions)
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_admin_all" ON public.document_permissions
FOR ALL USING (public.is_system_admin());

CREATE POLICY "permissions_owner_manage" ON public.document_permissions
FOR ALL USING (public.is_document_owner(document_id));

CREATE POLICY "permissions_manager_manage" ON public.document_permissions
FOR ALL USING (public.user_has_permission(document_id, 'manage'));

CREATE POLICY "permissions_own_view" ON public.document_permissions
FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on documents (can now safely reference document_permissions)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_admin_all" ON public.documents
FOR ALL USING (public.is_system_admin());

CREATE POLICY "documents_owner_all" ON public.documents
FOR ALL USING (auth.uid() = uploaded_by);

CREATE POLICY "documents_permitted_view" ON public.documents
FOR SELECT USING (
  public.user_has_permission(id, 'view') OR
  public.user_has_permission(id, 'sign') OR
  public.user_has_permission(id, 'manage')
);

CREATE POLICY "documents_authenticated_insert" ON public.documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on document_signatures
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_admin_all" ON public.document_signatures
FOR ALL USING (public.is_system_admin());

CREATE POLICY "signatures_own_view" ON public.document_signatures
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "signatures_document_owner_view" ON public.document_signatures
FOR SELECT USING (public.is_document_owner(document_id));

CREATE POLICY "signatures_permitted_view" ON public.document_signatures
FOR SELECT USING (
  public.user_has_permission(document_id, 'view') OR
  public.user_has_permission(document_id, 'sign') OR
  public.user_has_permission(document_id, 'manage')
);

CREATE POLICY "signatures_permitted_insert" ON public.document_signatures
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  public.user_has_permission(document_id, 'sign')
);

-- Force RLS for all tables
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures FORCE ROW LEVEL SECURITY;
