-- Fix trigger to use correct column name
-- The column is storeId (camelCase), not store_id (snake_case)

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_base_product_counts ON store_products;
DROP FUNCTION IF EXISTS update_base_product_counts();
DROP FUNCTION IF EXISTS update_base_product_count(UUID);

-- Recreate the function with correct column name
CREATE OR REPLACE FUNCTION update_base_product_count(product_id UUID)
RETURNS VOID AS $$
DECLARE
    store_count INTEGER;
    total_variants INTEGER;
BEGIN
    -- Count unique stores using correct column name
    SELECT COUNT(DISTINCT "storeId") INTO store_count
    FROM store_products 
    WHERE base_product_id = product_id AND "storeId" IS NOT NULL;
    
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
    WHERE base_products.id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_base_product_counts
    AFTER INSERT OR UPDATE OR DELETE ON store_products
    FOR EACH ROW
    EXECUTE FUNCTION update_base_product_counts();
