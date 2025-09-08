-- Script de prueba para verificar la zona horaria
-- Ejecutar este script para verificar que las fechas se guarden correctamente

-- Verificar configuración actual
SELECT 
    'Configuración actual:' as info,
    current_setting('timezone') as timezone,
    'Fecha actual:' as info2,
    NOW() as current_time,
    'Fecha en Chile:' as info3,
    NOW() AT TIME ZONE 'America/Santiago' as chile_time;

-- Insertar un registro de prueba para verificar el formato
INSERT INTO store_products (
    id, 
    name, 
    description, 
    "createdBy", 
    "createdAt", 
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'Producto de Prueba - Zona Horaria',
    'Verificación de zona horaria de Chile',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Verificar el registro insertado
SELECT 
    name,
    "createdAt",
    "updatedAt",
    "createdAt" AT TIME ZONE 'America/Santiago' as chile_created_at,
    "updatedAt" AT TIME ZONE 'America/Santiago' as chile_updated_at
FROM store_products 
WHERE name = 'Producto de Prueba - Zona Horaria'
ORDER BY "createdAt" DESC 
LIMIT 1;


