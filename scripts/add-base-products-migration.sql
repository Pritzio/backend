-- Add Base Products Migration Script
-- This script creates the base_products table and adds the baseProductId relationship to store_products

-- Create base_products table
CREATE TABLE base_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    brand VARCHAR(200),
    model VARCHAR(100),
    sku VARCHAR(100),
    image VARCHAR(500),
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    store_count INTEGER DEFAULT 0,
    total_variants INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for base_products
CREATE INDEX "IDX_base_products_name" ON base_products (name);
CREATE INDEX "IDX_base_products_brand" ON base_products (brand);
CREATE INDEX "IDX_base_products_is_active" ON base_products (is_active);
CREATE INDEX "IDX_base_products_store_count" ON base_products (store_count);

-- Add base_product_id column to store_products
ALTER TABLE store_products ADD COLUMN base_product_id UUID;

-- Create foreign key constraint
ALTER TABLE store_products 
ADD CONSTRAINT "FK_store_products_base_product" 
FOREIGN KEY (base_product_id) REFERENCES base_products(id) ON DELETE SET NULL;

-- Create index for the new relationship
CREATE INDEX "IDX_store_products_base_product_id" ON store_products (base_product_id);

-- Function to update base product counts automatically
CREATE OR REPLACE FUNCTION update_base_product_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_base_product_count(NEW.base_product_id);
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        PERFORM update_base_product_count(OLD.base_product_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Helper function to update base product counts
CREATE OR REPLACE FUNCTION update_base_product_count(product_id UUID)
RETURNS VOID AS $$
DECLARE
    store_count INTEGER;
    total_variants INTEGER;
BEGIN
    -- Count unique stores
    SELECT COUNT(DISTINCT store_id) INTO store_count
    FROM store_products 
    WHERE base_product_id = product_id AND store_id IS NOT NULL;
    
    -- Count total variants
    SELECT COUNT(*) INTO total_variants
    FROM store_products 
    WHERE base_product_id = product_id;
    
    -- Update base_products
    UPDATE base_products 
    SET 
        store_count = COALESCE(store_count, 0),
        total_variants = COALESCE(total_variants, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update counts automatically
CREATE TRIGGER trigger_update_base_product_counts
    AFTER INSERT OR UPDATE OR DELETE ON store_products
    FOR EACH ROW
    EXECUTE FUNCTION update_base_product_counts();

-- Add comment to document the migration
COMMENT ON TABLE base_products IS 'Base products for price comparison across stores';
COMMENT ON COLUMN base_products.name IS 'Normalized product name for matching';
COMMENT ON COLUMN base_products.brand IS 'Product brand for matching';
COMMENT ON COLUMN base_products.store_count IS 'Number of stores that have this product';
COMMENT ON COLUMN base_products.total_variants IS 'Total number of store product variants';
COMMENT ON COLUMN store_products.base_product_id IS 'Reference to base product for price comparison';

