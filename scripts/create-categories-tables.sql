-- Script para crear las tablas de categorías y sus relaciones
-- Ejecutar este script después de actualizar las entidades

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS "categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" varchar(200) NOT NULL,
    "description" varchar(500),
    "color" varchar(50),
    "icon" varchar(200),
    "isActive" boolean NOT NULL DEFAULT true,
    "productCount" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "PK_categories" PRIMARY KEY ("id")
);

-- Crear índice único para el nombre de categoría
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_name_unique" 
ON "categories" ("name") 
WHERE "isActive" = true;

-- Crear tabla de relación many-to-many entre store_products y categories
CREATE TABLE IF NOT EXISTS "store_product_categories" (
    "storeProductId" uuid NOT NULL,
    "categoryId" uuid NOT NULL,
    CONSTRAINT "PK_store_product_categories" PRIMARY KEY ("storeProductId", "categoryId")
);

-- Crear índices para la tabla de relación
CREATE INDEX IF NOT EXISTS "IDX_store_product_categories_storeProductId" 
ON "store_product_categories" ("storeProductId");

CREATE INDEX IF NOT EXISTS "IDX_store_product_categories_categoryId" 
ON "store_product_categories" ("categoryId");

-- Agregar foreign keys
ALTER TABLE "store_product_categories" 
ADD CONSTRAINT "FK_store_product_categories_storeProductId" 
FOREIGN KEY ("storeProductId") REFERENCES "store_products"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_product_categories" 
ADD CONSTRAINT "FK_store_product_categories_categoryId" 
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Crear función para actualizar el contador de productos en categorías
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar contador cuando se agrega una relación
    IF TG_OP = 'INSERT' THEN
        UPDATE "categories" 
        SET "productCount" = "productCount" + 1 
        WHERE "id" = NEW."categoryId";
        RETURN NEW;
    END IF;
    
    -- Actualizar contador cuando se elimina una relación
    IF TG_OP = 'DELETE' THEN
        UPDATE "categories" 
        SET "productCount" = "productCount" - 1 
        WHERE "id" = OLD."categoryId";
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para mantener el contador actualizado
DROP TRIGGER IF EXISTS "TR_store_product_categories_insert" ON "store_product_categories";
CREATE TRIGGER "TR_store_product_categories_insert"
    AFTER INSERT ON "store_product_categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_category_product_count();

DROP TRIGGER IF EXISTS "TR_store_product_categories_delete" ON "store_product_categories";
CREATE TRIGGER "TR_store_product_categories_delete"
    AFTER DELETE ON "store_product_categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_category_product_count();

-- Insertar algunas categorías de ejemplo
INSERT INTO "categories" ("name", "description", "color", "icon") VALUES
('Electrónicos', 'Productos electrónicos y tecnología', '#3B82F6', 'laptop'),
('Hogar y Jardín', 'Artículos para el hogar y jardín', '#10B981', 'home'),
('Ropa y Accesorios', 'Ropa, calzado y accesorios', '#F59E0B', 'shirt'),
('Deportes y Fitness', 'Artículos deportivos y fitness', '#EF4444', 'activity'),
('Libros y Medios', 'Libros, música y películas', '#8B5CF6', 'book'),
('Salud y Belleza', 'Productos de salud y belleza', '#EC4899', 'heart'),
('Automotriz', 'Repuestos y accesorios para vehículos', '#6B7280', 'car'),
('Juguetes y Juegos', 'Juguetes y juegos para todas las edades', '#F97316', 'gamepad2'),
('Alimentación', 'Productos alimenticios y bebidas', '#84CC16', 'utensils'),
('Oficina y Escuela', 'Artículos de oficina y material escolar', '#06B6D4', 'briefcase')
ON CONFLICT ("name") DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'store_product_categories')
ORDER BY table_name, ordinal_position;

-- Mostrar las categorías creadas
SELECT 
    id,
    name,
    description,
    color,
    icon,
    "productCount",
    "createdAt"
FROM "categories"
WHERE "isActive" = true
ORDER BY name;
