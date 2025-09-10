-- Fix trigger with proper variable names to avoid ambiguity

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_base_product_counts ON store_products;
DROP FUNCTION IF EXISTS update_base_product_counts();
DROP FUNCTION IF EXISTS update_base_product_count(UUID);

-- Recreate the function with different variable names
CREATE OR REPLACE FUNCTION update_base_product_count(product_id UUID)
RETURNS VOID AS $$
DECLARE
    unique_stores_count INTEGER;
    total_variants_count INTEGER;
BEGIN
    -- Count unique stores using correct column name
    SELECT COUNT(DISTINCT "storeId") INTO unique_stores_count
    FROM store_products 
    WHERE "baseProductId" = product_id AND "storeId" IS NOT NULL;
    
    -- Count total variants
    SELECT COUNT(*) INTO total_variants_count
    FROM store_products 
    WHERE "baseProductId" = product_id;
    
    -- Update base_products
    UPDATE base_products 
    SET 
        "storeCount" = COALESCE(unique_stores_count, 0),
        "totalVariants" = COALESCE(total_variants_count, 0),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE base_products.id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION update_base_product_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_base_product_count(NEW."baseProductId");
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        PERFORM update_base_product_count(OLD."baseProductId");
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_base_product_counts
    AFTER INSERT OR UPDATE OR DELETE ON store_products
    FOR EACH ROW
    EXECUTE FUNCTION update_base_product_counts();
