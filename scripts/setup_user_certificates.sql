-- This script sets up the necessary IAM policies for users to upload and download certificates
-- from a Google Cloud Storage bucket.

-- Replace 'your_project_id' with your actual Google Cloud project ID.
-- Replace 'user-certificates-bucket' with the name of your Cloud Storage bucket.
-- Replace 'user@example.com' with the email address of the user.

-- Create a custom IAM role for certificate management.
CREATE OR REPLACE ROLE roles/certificate.manager ROLES (roles/storage.objectViewer);

-- Grant the custom role to the user.
GRANT roles/certificate.manager ON PROJECT your_project_id TO "user@example.com";

-- Grant the user permission to list objects in the bucket.
GRANT roles/storage.objectViewer ON BUCKET user-certificates-bucket TO "user@example.com";

-- Grant the user permission to create objects in the bucket.
GRANT roles/storage.objectCreator ON BUCKET user-certificates-bucket TO "user@example.com";

-- Example policy for allowing a user to read objects from the bucket:
-- {
--   "bindings": [
--     {
--       "members": [
--         "user:user@example.com"
--       ],
--       "role": "roles/storage.objectViewer"
--     }
--   ],
--   "etag": "BwWqgip5yMM=",
--   "version": 3
-- }

-- Example policy for allowing a user to write objects to the bucket:
-- {
--   "bindings": [
--     {
--       "members": [
--         "user:user@example.com"
--       ],
--       "role": "roles/storage.objectCreator"
--     }
--   ],
--   "etag": "BwWqgip5yMM=",
--   "version": 3
-- }

-- Example policy for allowing a user to read and write objects to the bucket:
-- {
--   "bindings": [
--     {
--       "members": [
--         "user:user@example.com"
--       ],
--       "role": "roles/storage.objectAdmin"
--     }
--   ],
--   "etag": "BwWqgip5yMM=",
--   "version": 3
-- }
