-- Script para agregar índices únicos a la tabla store_products
-- Ejecutar este script después de actualizar la entidad StoreProduct

-- Agregar índice único para storeProductId (solo para valores no nulos)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "IDX_store_products_storeProductId_unique" 
ON "store_products" ("storeProductId") 
WHERE "storeProductId" IS NOT NULL;

-- Agregar índice único para url (solo para valores no nulos)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "IDX_store_products_url_unique" 
ON "store_products" ("url") 
WHERE "url" IS NOT NULL;

-- Verificar que los índices se crearon correctamente
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'store_products' 
AND indexname LIKE '%unique%';

-- Mostrar información sobre duplicados existentes (si los hay)
SELECT 
    'storeProductId' as field,
    "storeProductId" as value,
    COUNT(*) as count
FROM "store_products" 
WHERE "storeProductId" IS NOT NULL 
GROUP BY "storeProductId" 
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    'url' as field,
    "url" as value,
    COUNT(*) as count
FROM "store_products" 
WHERE "url" IS NOT NULL 
GROUP BY "url" 
HAVING COUNT(*) > 1;
