# Guía de Integración Frontend - Sistema de Comparación de Productos

## 📋 Resumen

Este documento proporciona toda la información necesaria para que el equipo de frontend implemente la funcionalidad de búsqueda y comparación de productos. El sistema permite a los usuarios buscar productos, comparar precios entre diferentes tiendas y encontrar las mejores ofertas.

## 🔐 Autenticación

### Endpoint de Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "testuser",
  "password": "testpassword123"
}
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

## 🔍 Endpoints de Búsqueda y Comparación

### 1. Búsqueda de Productos

**Endpoint:** `GET /api/v1/product-comparison/search`

**Parámetros:**
- `q` (string, requerido): Término de búsqueda (mínimo 2 caracteres)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Ejemplo de uso:**
```javascript
const searchProducts = async (query) => {
  const response = await fetch(`/api/v1/product-comparison/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "3383e40e-b89c-4dec-af6e-aa03e43353da",
      "name": "toalla papel abolengo doble hoja 10 m 3 un.",
      "brand": "abolengo",
      "model": null,
      "fullName": "abolengo toalla papel abolengo doble hoja 10 m 3 un.",
      "storeCount": 2,
      "totalVariants": 2,
      "image": "https://jumbocl.vteximg.com.br/arquivos/ids/307027-250-250/Toalla-de-Papel-Abolengo-Doble-Hoja-10-m-3-un.jpg?v=638776383693570000",
      "specifications": {
        "rating": null,
        "categories": ["Toallas de Papel"],
        "originalData": {
          "brand": "abolengo",
          "categories": ["Toallas de Papel"],
          "highResImageUrl": "https://jumbocl.vteximg.com.br/arquivos/ids/307027-250-250/Toalla-de-Papel-Abolengo-Doble-Hoja-10-m-3-un.jpg?v=638776383693570000"
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 43,
  "query": "toalla papel"
}
```

### 2. Comparación Detallada de Producto

**Endpoint:** `GET /api/v1/product-comparison/{baseProductId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Ejemplo de uso:**
```javascript
const getProductComparison = async (baseProductId) => {
  const response = await fetch(`/api/v1/product-comparison/${baseProductId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

**Respuesta:**
```json
{
  "baseProduct": {
    "id": "3383e40e-b89c-4dec-af6e-aa03e43353da",
    "name": "toalla papel abolengo doble hoja 10 m 3 un.",
    "brand": "abolengo",
    "model": null,
    "fullName": "abolengo toalla papel abolengo doble hoja 10 m 3 un.",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "storeProducts": [
    {
      "id": "store-product-id-1",
      "name": "Toalla de Papel Abolengo Doble Hoja 10 m 3 un.",
      "price": 1490,
      "url": "https://jumbo.cl/abolengo-10m-3un",
      "image": "https://jumbo.cl/images/abolengo-10m-3un.jpg",
      "store": {
        "id": "jumbo-store-id",
        "name": "Jumbo",
        "logo": "https://jumbo.cl/logo.png"
      }
    }
  ],
  "priceRange": {
    "min": 1450,
    "max": 1490,
    "avg": 1470
  },
  "stores": [
    {
      "store": {
        "id": "jumbo-store-id",
        "name": "Jumbo",
        "logo": "https://jumbo.cl/logo.png"
      },
      "product": {
        "id": "store-product-id-1",
        "name": "Toalla de Papel Abolengo Doble Hoja 10 m 3 un.",
        "price": 1490,
        "url": "https://jumbo.cl/abolengo-10m-3un"
      },
      "price": 1490
    }
  ]
}
```

## 🎨 Especificaciones de UI/UX

### 1. Página de Búsqueda Principal

#### Componentes Requeridos:

**SearchBar Component:**
```jsx
const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };
  
  return (
    <form onSubmit={handleSearch} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos... (mínimo 2 caracteres)"
        className="search-input"
        disabled={loading}
      />
      <button type="submit" disabled={loading || query.trim().length < 2}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  );
};
```

**ProductCard Component:**
```jsx
const ProductCard = ({ product, onViewDetails }) => {
  return (
    <div className="product-card">
      <div className="product-header">
        <h3 className="product-name">{product.name}</h3>
        <span className="product-brand">{product.brand}</span>
      </div>
      
      <div className="product-stats">
        <div className="store-count">
          <span className="icon">🏪</span>
          {product.storeCount} tienda{product.storeCount !== 1 ? 's' : ''}
        </div>
        <div className="variants-count">
          <span className="icon">📦</span>
          {product.totalVariants} variante{product.totalVariants !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          onClick={() => onViewDetails(product.id)}
          className="btn-primary"
        >
          Ver Comparación
        </button>
      </div>
    </div>
  );
};
```

**ProductList Component:**
```jsx
const ProductList = ({ products, onProductSelect, loading }) => {
  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }
  
  if (products.length === 0) {
    return <div className="no-results">No se encontraron productos</div>;
  }
  
  return (
    <div className="product-list">
      <div className="results-header">
        <h2>Resultados de búsqueda ({products.length})</h2>
      </div>
      
      <div className="products-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={onProductSelect}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Página de Comparación de Producto

#### Componentes Requeridos:

**ProductComparison Component:**
```jsx
const ProductComparison = ({ baseProduct, stores, priceRange }) => {
  return (
    <div className="product-comparison">
      <div className="product-header">
        <h1>{baseProduct.name}</h1>
        <p className="product-brand">{baseProduct.brand}</p>
      </div>
      
      <div className="price-summary">
        <div className="price-range">
          <span className="price-min">${priceRange.min}</span>
          <span className="price-separator"> - </span>
          <span className="price-max">${priceRange.max}</span>
        </div>
        <div className="price-average">
          Precio promedio: ${priceRange.avg}
        </div>
      </div>
      
      <div className="stores-comparison">
        <h3>Disponible en {stores.length} tienda{stores.length !== 1 ? 's' : ''}</h3>
        
        <div className="stores-list">
          {stores.map((store, index) => (
            <StoreCard key={index} store={store} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**StoreCard Component:**
```jsx
const StoreCard = ({ store }) => {
  return (
    <div className="store-card">
      <div className="store-header">
        <img 
          src={store.store.logo} 
          alt={store.store.name}
          className="store-logo"
        />
        <h4 className="store-name">{store.store.name}</h4>
      </div>
      
      <div className="product-details">
        <p className="product-name">{store.product.name}</p>
        <div className="price-section">
          <span className="price">${store.price}</span>
          <a 
            href={store.product.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-visit-store"
          >
            Ver en tienda
          </a>
        </div>
      </div>
    </div>
  );
};
```

### 3. Filtros y Búsqueda Avanzada

**FilterBar Component:**
```jsx
const FilterBar = ({ onFilterChange, brands, loading }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  
  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    onFilterChange({ brand });
  };
  
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Marca:</label>
        <select 
          value={selectedBrand} 
          onChange={(e) => handleBrandChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Todas las marcas</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Disponibilidad:</label>
        <select onChange={(e) => onFilterChange({ availability: e.target.value })}>
          <option value="">Todas</option>
          <option value="multiple">Múltiples tiendas</option>
          <option value="single">Una tienda</option>
        </select>
      </div>
    </div>
  );
};
```

## 📱 Estructura de Páginas

### 1. Página Principal de Búsqueda (`/search`)

```jsx
const SearchPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  
  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const results = await searchProducts(searchQuery);
      setProducts(results.data);
      setQuery(searchQuery);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProductSelect = (productId) => {
    // Navegar a página de comparación
    window.location.href = `/product/${productId}`;
  };
  
  return (
    <div className="search-page">
      <SearchBar onSearch={handleSearch} loading={loading} />
      <FilterBar onFilterChange={handleFilterChange} />
      <ProductList 
        products={products} 
        onProductSelect={handleProductSelect}
        loading={loading}
      />
    </div>
  );
};
```

### 2. Página de Comparación de Producto (`/product/:id`)

```jsx
const ProductComparisonPage = () => {
  const { id } = useParams();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadComparison = async () => {
      try {
        const data = await getProductComparison(id);
        setComparison(data);
      } catch (error) {
        console.error('Error loading comparison:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComparison();
  }, [id]);
  
  if (loading) return <div className="loading">Cargando comparación...</div>;
  if (!comparison) return <div className="error">Producto no encontrado</div>;
  
  return (
    <div className="product-comparison-page">
      <ProductComparison 
        baseProduct={comparison.baseProduct}
        stores={comparison.stores}
        priceRange={comparison.priceRange}
      />
    </div>
  );
};
```

## 🎨 Estilos CSS Sugeridos

```css
/* Search Bar */
.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

/* Product Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.product-brand {
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-stats {
  display: flex;
  gap: 15px;
  margin: 15px 0;
  font-size: 14px;
  color: #666;
}

.store-count, .variants-count {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Store Comparison */
.stores-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.store-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.store-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: #007bff;
}

.btn-visit-store {
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-visit-store:hover {
  background: #0056b3;
}

/* Price Summary */
.price-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}

.price-range {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 10px;
}

.price-average {
  color: #666;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .stores-list {
    grid-template-columns: 1fr;
  }
  
  .search-form {
    flex-direction: column;
  }
}
```

## 🚀 Ejemplos de Uso Completo

### 1. Búsqueda Básica
```javascript
// Buscar productos de toalla papel
const products = await searchProducts('toalla papel');
console.log(`Encontrados ${products.data.length} productos`);
```

### 2. Búsqueda por Marca
```javascript
// Buscar productos de la marca Nova
const novaProducts = await searchProducts('nova');
console.log(`Encontrados ${novaProducts.data.length} productos Nova`);
```

### 3. Comparación de Precios
```javascript
// Obtener comparación detallada de un producto
const comparison = await getProductComparison('3383e40e-b89c-4dec-af6e-aa03e43353da');
console.log(`Producto disponible en ${comparison.stores.length} tiendas`);
console.log(`Rango de precios: $${comparison.priceRange.min} - $${comparison.priceRange.max}`);
```

## 📊 Métricas y Analytics

### Eventos Sugeridos para Tracking:

1. **Búsqueda realizada**: `search_performed`
   - `query`: término de búsqueda
   - `results_count`: número de resultados

2. **Producto seleccionado**: `product_selected`
   - `product_id`: ID del producto
   - `product_name`: nombre del producto
   - `store_count`: número de tiendas

3. **Comparación vista**: `comparison_viewed`
   - `product_id`: ID del producto
   - `stores_count`: número de tiendas en comparación

4. **Tienda visitada**: `store_visited`
   - `store_id`: ID de la tienda
   - `product_id`: ID del producto
   - `price`: precio del producto

## 🔧 Configuración de Desarrollo

### Variables de Entorno:
```env
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_APP_NAME=Pritzio Product Comparison
```

### Dependencias Sugeridas:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "styled-components": "^5.0.0"
  }
}
```

## 📝 Notas Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación con JWT
2. **Rate Limiting**: Implementar debounce en la búsqueda para evitar demasiadas requests
3. **Error Handling**: Manejar errores de red y respuestas vacías
4. **Loading States**: Mostrar estados de carga durante las requests
5. **Responsive Design**: Asegurar que funcione en móviles y tablets
6. **Accessibility**: Implementar ARIA labels y navegación por teclado

## 🎯 Próximos Pasos

1. **Implementar la página de búsqueda principal**
2. **Crear la página de comparación de productos**
3. **Agregar filtros y búsqueda avanzada**
4. **Implementar responsive design**
5. **Agregar analytics y tracking**
6. **Realizar testing de usabilidad**

---

**Contacto**: Para dudas técnicas, contactar al equipo de backend.
**Última actualización**: Enero 2024
