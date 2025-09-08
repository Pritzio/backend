-- =====================================================
-- Store Products Enhancement Migration
-- =====================================================
-- This migration adds store relationship to store_products
-- and makes store fields optional for auto-creation from scraping
-- =====================================================

-- 1. Make store fields optional
-- =====================================================

-- Make website nullable in stores table
ALTER TABLE stores 
ALTER COLUMN website DROP NOT NULL;

-- Make createdBy nullable in stores table  
ALTER TABLE stores 
ALTER COLUMN createdBy DROP NOT NULL;

-- Update unique constraint on website to allow NULL values
DROP INDEX IF EXISTS "IDX_stores_website";
CREATE UNIQUE INDEX "IDX_stores_website" ON stores (website) WHERE website IS NOT NULL;

-- 2. Add store relationship to store_products
-- =====================================================

-- Add storeId column to store_products table
ALTER TABLE store_products 
ADD COLUMN "storeId" uuid;

-- Add foreign key constraint to stores table
ALTER TABLE store_products 
ADD CONSTRAINT "FK_store_products_store" 
FOREIGN KEY ("storeId") REFERENCES stores(id) ON DELETE SET NULL;

-- Add index for storeId
CREATE INDEX "IDX_store_products_storeId" ON store_products ("storeId");

-- 3. Update existing data (optional)
-- =====================================================

-- If you have existing store_products without stores, you can create a default store
-- INSERT INTO stores (id, name, description, type, status, category, "isVerified", "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'Default Store',
--   'Default store for existing products',
--   'online',
--   'active', 
--   'other',
--   false,
--   NOW(),
--   NOW()
-- );

-- Update existing store_products to reference the default store (uncomment if needed)
-- UPDATE store_products 
-- SET "storeId" = (SELECT id FROM stores WHERE name = 'Default Store' LIMIT 1)
-- WHERE "storeId" IS NULL;

-- 4. Add comments for documentation
-- =====================================================

COMMENT ON COLUMN stores.website IS 'Store website URL - nullable for auto-created stores';
COMMENT ON COLUMN stores."createdBy" IS 'User who created the store - nullable for auto-created stores';
COMMENT ON COLUMN store_products."storeId" IS 'Reference to the store this product belongs to - nullable for products without store association';

-- 5. Verify the changes
-- =====================================================

-- Check that the constraints are working
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('stores', 'store_products')
AND column_name IN ('website', 'createdBy', 'storeId')
ORDER BY table_name, column_name;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'store_products'
AND kcu.column_name = 'storeId';

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('stores', 'store_products')
AND indexname LIKE '%website%' OR indexname LIKE '%storeId%'
ORDER BY tablename, indexname;

-- =====================================================
-- Migration completed successfully
-- =====================================================
-- The store_products table now has a relationship with stores
-- Stores can be auto-created from scraping data with minimal required fields
-- All existing data is preserved
-- =====================================================
