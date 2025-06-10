-- Drop existing table if it has issues
DROP TABLE IF EXISTS document_signatures CASCADE;

-- Create document_signatures table with correct structure
CREATE TABLE document_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES user_certificates(id) ON DELETE SET NULL,
  signature_reason TEXT DEFAULT 'Firma digital',
  signature_data JSONB DEFAULT '{}',
  signature_hash TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX idx_document_signatures_user_id ON document_signatures(user_id);
CREATE INDEX idx_document_signatures_signed_at ON document_signatures(signed_at);

-- Create unique constraint to prevent duplicate signatures
CREATE UNIQUE INDEX idx_document_signatures_unique 
ON document_signatures(document_id, user_id);

-- Enable RLS
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own signatures" ON document_signatures
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own signatures" ON document_signatures
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System admins can view all signatures" ON document_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'system_admin'
    )
  );

CREATE POLICY "Area coordinators can view signatures in their department" ON document_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN documents d ON d.id = document_signatures.document_id
      JOIN users u2 ON u2.id = d.uploaded_by
      WHERE u1.id = auth.uid() 
      AND u1.role = 'area_coordinator'
      AND u1.department = u2.department
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_signatures_updated_at 
  BEFORE UPDATE ON document_signatures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
