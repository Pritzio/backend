-- Migration Script: Add Terms and Conditions Acceptance
-- Date: 2025-08-29
-- Description: Add fields to track user acceptance of terms and conditions

-- Add termsAccepted column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT FALSE;

-- Add termsAcceptedAt column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP;

-- Update existing users to have accepted terms (for data consistency)
UPDATE users 
SET "termsAccepted" = TRUE, "termsAcceptedAt" = "createdAt"
WHERE "termsAccepted" IS NULL OR "termsAccepted" = FALSE;

-- Make termsAccepted NOT NULL after updating existing records
ALTER TABLE users 
ALTER COLUMN "termsAccepted" SET NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN users."termsAccepted" IS 'Indicates whether the user has accepted terms and conditions';
COMMENT ON COLUMN users."termsAcceptedAt" IS 'Timestamp when the user accepted terms and conditions';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('termsAccepted', 'termsAcceptedAt');

-- Show sample data
SELECT 
    username, 
    email, 
    "termsAccepted", 
    "termsAcceptedAt"
FROM users 
LIMIT 5;
