-- Create table for storing certificate content
CREATE TABLE IF NOT EXISTS certificate_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES user_certificates(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('certificate', 'private_key')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(certificate_id, content_type)
);

-- Enable RLS
ALTER TABLE certificate_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own certificate content" ON certificate_content
  FOR SELECT USING (
    certificate_id IN (
      SELECT id FROM user_certificates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own certificate content" ON certificate_content
  FOR INSERT WITH CHECK (
    certificate_id IN (
      SELECT id FROM user_certificates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can view all certificate content" ON certificate_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_certificate_content_certificate_id ON certificate_content(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_content_type ON certificate_content(certificate_id, content_type);
