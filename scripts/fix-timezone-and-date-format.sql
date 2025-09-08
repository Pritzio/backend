-- Script para configurar zona horaria y formato de fecha correcto
-- Ejecutar este script en la base de datos PostgreSQL

-- 1. Configurar la zona horaria de la sesión actual
SET timezone = 'America/Santiago';

-- Configurar la zona horaria a nivel de base de datos
ALTER DATABASE pritzio SET timezone = 'America/Santiago';

-- 2. Verificar la configuración de zona horaria
SHOW timezone;

-- 3. Actualizar las columnas de timestamp para usar timezone
-- Nota: Esto solo es necesario si las columnas no tienen timezone configurado

-- Para la tabla store_products
ALTER TABLE store_products 
ALTER COLUMN "createdAt" TYPE timestamp with time zone,
ALTER COLUMN "updatedAt" TYPE timestamp with time zone,
ALTER COLUMN "lastScraped" TYPE timestamp with time zone;

-- 4. Configurar el formato de fecha para la sesión (opcional)
-- Esto afecta cómo se muestran las fechas en las consultas
SET datestyle = 'ISO, DMY';

-- 5. Verificar el formato de fecha configurado
SHOW datestyle;

-- 6. Crear una función para formatear fechas en formato chileno (DD/MM/YYYY)
CREATE OR REPLACE FUNCTION format_date_chile(input_date timestamp with time zone)
RETURNS text AS $$
BEGIN
    RETURN TO_CHAR(input_date AT TIME ZONE 'America/Santiago', 'DD/MM/YYYY HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- 7. Crear una función para obtener la fecha actual en zona horaria de Chile
CREATE OR REPLACE FUNCTION get_chile_time()
RETURNS timestamp with time zone AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Santiago';
END;
$$ LANGUAGE plpgsql;

-- 8. Verificar que todo funciona correctamente
SELECT 
    'Zona horaria configurada:' as info,
    current_setting('timezone') as timezone,
    'Formato de fecha:' as info2,
    current_setting('datestyle') as date_style,
    'Fecha actual en Chile:' as info3,
    get_chile_time() as chile_time,
    'Formato chileno:' as info4,
    format_date_chile(NOW()) as formatted_date;
