-- Fix Base Products Migration
-- This script fixes the base_products table structure and adds the missing column

-- Add missing columns to base_products if they don't exist
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'base_products' AND column_name = 'is_active') THEN
        ALTER TABLE base_products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add store_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'base_products' AND column_name = 'store_count') THEN
        ALTER TABLE base_products ADD COLUMN store_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_variants column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'base_products' AND column_name = 'total_variants') THEN
        ALTER TABLE base_products ADD COLUMN total_variants INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add base_product_id column to store_products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'store_products' AND column_name = 'base_product_id') THEN
        ALTER TABLE store_products ADD COLUMN base_product_id UUID;
    END IF;
END $$;

-- Create foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'FK_store_products_base_product') THEN
        ALTER TABLE store_products 
        ADD CONSTRAINT "FK_store_products_base_product" 
        FOREIGN KEY (base_product_id) REFERENCES base_products(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for the relationship if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'IDX_store_products_base_product_id') THEN
        CREATE INDEX "IDX_store_products_base_product_id" ON store_products (base_product_id);
    END IF;
END $$;

-- Update existing records to have default values
UPDATE base_products SET 
    is_active = COALESCE(is_active, true),
    store_count = COALESCE(store_count, 0),
    total_variants = COALESCE(total_variants, 0)
WHERE is_active IS NULL OR store_count IS NULL OR total_variants IS NULL;

