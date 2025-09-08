-- Script para limpiar y recrear la base de datos
-- Ejecutar este script para resolver problemas de sincronización

-- 1. Eliminar todas las tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS physical_locations CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- 2. Eliminar tipos personalizados si existen
DROP TYPE IF EXISTS location_status CASCADE;
DROP TYPE IF EXISTS store_type CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS role_type CASCADE;

-- 3. Verificar que no quedan tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 4. Verificar que no quedan tipos personalizados
SELECT typname 
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e';


