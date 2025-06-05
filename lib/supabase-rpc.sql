-- Create a function to increment the signature count of a document
CREATE OR REPLACE FUNCTION increment_signature_count(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE documents
  SET 
    signature_count = signature_count + 1,
    status = CASE 
      WHEN signature_count + 1 >= requires_signatures THEN 'signed'
      ELSE 'in_review'
    END
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql;
