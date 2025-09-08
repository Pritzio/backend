-- Add storeProductId column to store_products table
ALTER TABLE store_products 
ADD COLUMN IF NOT EXISTS "storeProductId" VARCHAR(100);

-- Add unique index for storeProductId (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_products_storeProductId" 
ON store_products ("storeProductId") 
WHERE "storeProductId" IS NOT NULL;
