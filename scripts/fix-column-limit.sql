-- Fix column limit issue in store_products table
-- Execute in sequential order

-- Step 1: Remove problematic columns
ALTER TABLE store_products DROP COLUMN IF EXISTS "availabilityHistory";
ALTER TABLE store_products DROP COLUMN IF EXISTS "priceHistory";
ALTER TABLE store_products DROP COLUMN IF EXISTS "scrapingHistory";
ALTER TABLE store_products DROP COLUMN IF EXISTS "specifications";
ALTER TABLE store_products DROP COLUMN IF EXISTS "features";
ALTER TABLE store_products DROP COLUMN IF EXISTS "tags";
ALTER TABLE store_products DROP COLUMN IF EXISTS "metadata";
ALTER TABLE store_products DROP COLUMN IF EXISTS "scrapingConfig";

-- Step 2: Create history tables
CREATE TABLE IF NOT EXISTS store_product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('online', 'physical')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('scraping', 'manual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_product_availability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  availability VARCHAR(20) NOT NULL CHECK (availability IN ('in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'backorder')),
  stock_quantity INTEGER,
  source VARCHAR(20) NOT NULL CHECK (source IN ('scraping', 'manual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_product_scraping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'scheduled')),
  price DECIMAL(10,2),
  availability VARCHAR(20),
  stock_quantity INTEGER,
  error TEXT,
  response_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create EAV attributes table
CREATE TABLE IF NOT EXISTS store_product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID NOT NULL,
  attribute_key VARCHAR(100) NOT NULL,
  attribute_value TEXT,
  attribute_type VARCHAR(50) NOT NULL CHECK (attribute_type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Add foreign key constraints
ALTER TABLE store_product_price_history 
ADD CONSTRAINT fk_price_history_store_product 
FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE;

ALTER TABLE store_product_availability_history 
ADD CONSTRAINT fk_availability_history_store_product 
FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE;

ALTER TABLE store_product_scraping_history 
ADD CONSTRAINT fk_scraping_history_store_product 
FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE;

ALTER TABLE store_product_attributes 
ADD CONSTRAINT fk_attributes_store_product 
FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE;

-- Step 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON store_product_price_history(store_product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON store_product_price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_type ON store_product_price_history(type);

CREATE INDEX IF NOT EXISTS idx_availability_history_product_id ON store_product_availability_history(store_product_id);
CREATE INDEX IF NOT EXISTS idx_availability_history_timestamp ON store_product_availability_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_availability_history_availability ON store_product_availability_history(availability);

CREATE INDEX IF NOT EXISTS idx_scraping_history_product_id ON store_product_scraping_history(store_product_id);
CREATE INDEX IF NOT EXISTS idx_scraping_history_timestamp ON store_product_scraping_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_scraping_history_status ON store_product_scraping_history(status);

CREATE INDEX IF NOT EXISTS idx_attributes_product_id ON store_product_attributes(store_product_id);
CREATE INDEX IF NOT EXISTS idx_attributes_key ON store_product_attributes(attribute_key);
CREATE INDEX IF NOT EXISTS idx_attributes_type ON store_product_attributes(attribute_type);

-- Step 6: Verify current status
SELECT 
  'store_products' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) < 1600 THEN 'OK - Within limit'
    WHEN COUNT(*) = 1600 THEN 'CRITICAL - At limit'
    ELSE 'ERROR - Exceeds limit'
  END as status
FROM information_schema.columns 
WHERE table_name = 'store_products'
GROUP BY table_name;

SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'Created'
    ELSE 'Not created'
  END as status
FROM (
  SELECT 'store_product_price_history' as table_name
  UNION ALL
  SELECT 'store_product_availability_history'
  UNION ALL
  SELECT 'store_product_scraping_history'
  UNION ALL
  SELECT 'store_product_attributes'
) t
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = t.table_name
);

-- Step 7: Migrate existing data (optional)
INSERT INTO store_product_price_history (store_product_id, timestamp, price, currency, type, source)
SELECT 
  id,
  updated_at,
  COALESCE("onlinePrice", "physicalPrice"),
  COALESCE(currency, 'USD'),
  CASE 
    WHEN "onlinePrice" IS NOT NULL THEN 'online'
    WHEN "physicalPrice" IS NOT NULL THEN 'physical'
    ELSE 'online'
  END,
  'manual'
FROM store_products 
WHERE "onlinePrice" IS NOT NULL OR "physicalPrice" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO store_product_availability_history (store_product_id, timestamp, availability, stock_quantity, source)
SELECT 
  id,
  updated_at,
  availability,
  "stockQuantity",
  'manual'
FROM store_products 
WHERE availability IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 8: Final cleanup
ANALYZE store_products;
ANALYZE store_product_price_history;
ANALYZE store_product_availability_history;
ANALYZE store_product_scraping_history;
ANALYZE store_product_attributes;

SELECT 'Script executed successfully' as result;

/*
POST-EXECUTION INSTRUCTIONS:

1. Verify store_products has less than 1600 columns
2. Verify all history tables were created
3. Change synchronize: false to true in app.module.ts
4. Restart the application
5. Verify no database connection errors

If everything is OK:
- Application should start without errors
- History functionality will work through new tables
- Query performance will improve

If there are problems:
- Check PostgreSQL logs
- Verify constraints and foreign keys
- Restore from backup if necessary
*/
