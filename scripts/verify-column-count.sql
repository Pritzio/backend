-- Quick Verification Script - Column Count
-- Execute to verify current table status

-- General column verification
SELECT 
  table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) < 1500 THEN 'OK'
    WHEN COUNT(*) < 1600 THEN 'WARNING'
    WHEN COUNT(*) = 1600 THEN 'CRITICAL'
    ELSE 'ERROR'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'stores', 'products', 'store_products', 
    'physical_locations', 'store_product_price_history',
    'store_product_availability_history', 'store_product_scraping_history',
    'store_product_attributes'
  )
GROUP BY table_name
ORDER BY column_count DESC;

-- Specific store_products verification
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'store_products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  data_type,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'store_products'
  AND table_schema = 'public'
GROUP BY data_type
ORDER BY count DESC;

-- History tables verification
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'Exists'
    ELSE 'Not found'
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
  AND table_schema = 'public'
);

-- Constraints verification
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.constraint_name IS NOT NULL THEN 'OK'
    ELSE 'Missing'
  END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'store_product_price_history',
    'store_product_availability_history', 
    'store_product_scraping_history',
    'store_product_attributes'
  );

-- Indexes verification
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'store_product_price_history',
  'store_product_availability_history',
  'store_product_scraping_history', 
  'store_product_attributes'
)
ORDER BY tablename, indexname;

-- ========================================
-- RESUMEN DEL ESTADO
-- ========================================

-- Estado general de la base de datos
SELECT 
  'RESUMEN DEL ESTADO' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'store_products' 
      AND table_schema = 'public'
      GROUP BY table_name
      HAVING COUNT(*) >= 1600
    ) THEN '🚨 CRÍTICO: store_products tiene 1600+ columnas'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'store_products' 
      AND table_schema = 'public'
      GROUP BY table_name
      HAVING COUNT(*) >= 1500
    ) THEN '⚠️ ADVERTENCIA: store_products se acerca al límite'
    ELSE '✅ OK: Todas las tablas están dentro del límite'
  END as status;

-- ========================================
-- RECOMENDACIONES
-- ========================================

/*
RECOMENDACIONES BASADAS EN LOS RESULTADOS:

🚨 SI store_products tiene 1600 columnas:
   - Ejecutar inmediatamente scripts/fix-column-limit.sql
   - NO reiniciar la aplicación hasta resolver

⚠️ SI store_products tiene 1500+ columnas:
   - Planificar migración a tablas separadas
   - Considerar optimización de estructura

✅ SI todas las tablas están bien:
   - Verificar que las tablas de historial existen
   - Verificar que los foreign keys están configurados
   - Considerar reactivar synchronize: true

📊 PARA OPTIMIZACIÓN FUTURA:
   - Usar tablas separadas para historiales
   - Implementar particionamiento por fecha
   - Considerar archivo de datos antiguos
*/
