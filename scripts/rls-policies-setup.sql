-- Drop existing functions and policies to ensure a clean setup
DROP FUNCTION IF EXISTS is_system_admin();
DROP FUNCTION IF EXISTS is_document_owner(UUID);
DROP FUNCTION IF EXISTS has_document_permission(UUID, TEXT);

-- Disable RLS on tables before dropping policies
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures DISABLE ROW LEVEL SECURITY;

-- Drop policies in a specific order if dependencies exist, or handle errors if they don't exist
-- For 'documents'
DROP POLICY IF EXISTS "Allow all access for system admins on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to view documents they have permission for" ON public.documents;
DROP POLICY IF EXISTS "Allow insert for authenticated users on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow update for owners or admins on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow delete for owners or admins on documents" ON public.documents;

-- For 'document_permissions'
DROP POLICY IF EXISTS "Allow all access for system admins on document_permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Allow document owner or manager to manage permissions" ON public.document_permissions;
DROP POLICY IF EXISTS "Allow users to view their own permissions" ON public.document_permissions;

-- For 'users'
DROP POLICY IF EXISTS "Allow system admins to manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

-- For 'document_signatures'
DROP POLICY IF EXISTS "Allow system admins full access to signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users to view their own signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users with view permission on document to see signatures" ON public.document_signatures;
DROP POLICY IF EXISTS "Allow users with sign permission to insert their signature" ON public.document_signatures;


-- Helper function to check if the current user is a system_admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'system_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if the current user is the owner of a document
CREATE OR REPLACE FUNCTION is_document_owner(p_document_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = p_document_id AND d.uploaded_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if a user has a specific permission for a document
CREATE OR REPLACE FUNCTION has_document_permission(p_document_id UUID, p_permission_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.document_permissions dp
    WHERE dp.document_id = p_document_id
      AND dp.user_id = auth.uid()
      AND dp.permission_type = p_permission_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Policies for 'documents' table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for system admins on documents"
ON public.documents FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "Allow users to view their own documents"
ON public.documents FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Allow users to view documents they have permission for"
ON public.documents FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.document_permissions dp
    WHERE dp.document_id = documents.id
      AND dp.user_id = auth.uid()
      AND (dp.permission_type IN ('view', 'sign', 'manage'))
  )
);

CREATE POLICY "Allow insert for authenticated users on documents"
ON public.documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for owners or admins on documents"
ON public.documents FOR UPDATE USING (is_document_owner(id) OR is_system_admin()) WITH CHECK (is_document_owner(id) OR is_system_admin());

CREATE POLICY "Allow delete for owners or admins on documents"
ON public.documents FOR DELETE USING (is_document_owner(id) OR is_system_admin());


-- Policies for 'document_permissions' table
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for system admins on document_permissions"
ON public.document_permissions FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "Allow document owner or manager to manage permissions"
ON public.document_permissions FOR ALL
USING (
  is_document_owner(document_id) OR  -- Uses SECURITY DEFINER function
  has_document_permission(document_id, 'manage') -- Uses SECURITY DEFINER function
)
WITH CHECK (
  is_document_owner(document_id) OR
  has_document_permission(document_id, 'manage')
);

CREATE POLICY "Allow users to view their own permissions"
ON public.document_permissions FOR SELECT USING (auth.uid() = user_id);


-- Policies for 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system admins to manage all users"
ON public.users FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "Allow users to view their own profile"
ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- Policies for 'document_signatures' table
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system admins full access to signatures"
ON public.document_signatures FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "Allow users to view their own signatures"
ON public.document_signatures FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users with view/sign/manage permission on document to see signatures"
ON public.document_signatures FOR SELECT USING (
  is_document_owner(document_id) OR
  EXISTS (
    SELECT 1
    FROM public.document_permissions dp
    WHERE dp.document_id = document_signatures.document_id
      AND dp.user_id = auth.uid()
      AND (dp.permission_type IN ('view', 'sign', 'manage'))
  )
);

CREATE POLICY "Allow users with sign permission to insert their signature"
ON public.document_signatures FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  has_document_permission(document_id, 'sign') AND
  NOT EXISTS (
    SELECT 1
    FROM public.document_signatures ds_check
    WHERE ds_check.document_id = document_signatures.document_id
      AND ds_check.user_id = auth.uid()
  )
);

-- Grant usage on functions to authenticated and anon roles (as needed)
GRANT EXECUTE ON FUNCTION is_system_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_document_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_document_permission(UUID, TEXT) TO authenticated;

-- Force RLS for table owners (best practice)
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures FORCE ROW LEVEL SECURITY;
