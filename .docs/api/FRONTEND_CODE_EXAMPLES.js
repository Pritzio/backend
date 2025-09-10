/**
 * Pritzio Product Comparison API - Frontend Code Examples
 * 
 * Este archivo contiene ejemplos de código para implementar
 * la funcionalidad de búsqueda y comparación de productos
 */

// ============================================================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================================================

const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000
};

// Clase para manejar la autenticación
class AuthService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  async login(identifier, password) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.accessToken;
      localStorage.setItem('accessToken', this.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('accessToken');
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Instancia global del servicio de autenticación
const authService = new AuthService();

// ============================================================================
// SERVICIO DE BÚSQUEDA DE PRODUCTOS
// ============================================================================

class ProductSearchService {
  /**
   * Buscar productos por término de búsqueda
   * @param {string} query - Término de búsqueda (mínimo 2 caracteres)
   * @returns {Promise<Object>} - Resultados de la búsqueda
   */
  async searchProducts(query) {
    if (!query || query.trim().length < 2) {
      throw new Error('Query must be at least 2 characters');
    }

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/product-comparison/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: authService.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Obtener comparación detallada de un producto
   * @param {string} baseProductId - ID del producto base
   * @returns {Promise<Object>} - Comparación detallada del producto
   */
  async getProductComparison(baseProductId) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/product-comparison/${baseProductId}`,
        {
          method: 'GET',
          headers: authService.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Comparison failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Comparison error:', error);
      throw error;
    }
  }

  /**
   * Buscar productos por marca
   * @param {string} brand - Nombre de la marca
   * @returns {Promise<Object>} - Productos de la marca
   */
  async searchByBrand(brand) {
    return this.searchProducts(brand);
  }

  /**
   * Obtener productos con múltiples tiendas
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Array>} - Productos disponibles en múltiples tiendas
   */
  async getMultiStoreProducts(query) {
    const results = await this.searchProducts(query);
    return results.data.filter(product => product.storeCount > 1);
  }
}

// Instancia global del servicio de búsqueda
const productSearchService = new ProductSearchService();

// ============================================================================
// HOOKS DE REACT (si usas React)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para búsqueda de productos
 */
export const useProductSearch = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    try {
      const results = await productSearchService.searchProducts(searchQuery);
      setProducts(results.data);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setProducts([]);
    setQuery('');
    setError(null);
  }, []);

  return {
    products,
    loading,
    error,
    query,
    search,
    clearSearch
  };
};

/**
 * Hook para comparación de productos
 */
export const useProductComparison = (baseProductId) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!baseProductId) return;

    const loadComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await productSearchService.getProductComparison(baseProductId);
        setComparison(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [baseProductId]);

  return { comparison, loading, error };
};

// ============================================================================
// COMPONENTES DE REACT
// ============================================================================

/**
 * Componente de barra de búsqueda
 */
export const SearchBar = ({ onSearch, loading, placeholder = "Buscar productos..." }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          disabled={loading}
          minLength={2}
        />
        <button 
          type="submit" 
          disabled={loading || query.trim().length < 2}
          className="search-button"
        >
          {loading ? 'Buscando...' : '🔍'}
        </button>
      </div>
    </form>
  );
};

/**
 * Componente de tarjeta de producto
 */
export const ProductCard = ({ product, onViewDetails, className = "" }) => {
  const handleClick = () => {
    onViewDetails(product.id);
  };

  return (
    <div className={`product-card ${className}`} onClick={handleClick}>
      <div className="product-header">
        <h3 className="product-name">{product.name}</h3>
        <span className="product-brand">{product.brand}</span>
      </div>
      
      <div className="product-stats">
        <div className="stat-item">
          <span className="icon">🏪</span>
          <span className="text">{product.storeCount} tienda{product.storeCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="stat-item">
          <span className="icon">📦</span>
          <span className="text">{product.totalVariants} variante{product.totalVariants !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      <div className="product-actions">
        <button className="btn-primary">
          Ver Comparación
        </button>
      </div>
    </div>
  );
};

/**
 * Componente de lista de productos
 */
export const ProductList = ({ products, onProductSelect, loading, error }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-results">
        <p>No se encontraron productos</p>
      </div>
    );
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

/**
 * Componente de comparación de producto
 */
export const ProductComparison = ({ baseProduct, stores, priceRange }) => {
  if (!baseProduct || !stores) {
    return <div className="loading">Cargando comparación...</div>;
  }

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

/**
 * Componente de tarjeta de tienda
 */
export const StoreCard = ({ store }) => {
  const handleVisitStore = (e) => {
    e.stopPropagation();
    window.open(store.product.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="store-card">
      <div className="store-header">
        <img 
          src={store.store.logo} 
          alt={store.store.name}
          className="store-logo"
          onError={(e) => {
            e.target.src = '/default-store-logo.png';
          }}
        />
        <h4 className="store-name">{store.store.name}</h4>
      </div>
      
      <div className="product-details">
        <p className="product-name">{store.product.name}</p>
        <div className="price-section">
          <span className="price">${store.price}</span>
          <button 
            onClick={handleVisitStore}
            className="btn-visit-store"
          >
            Ver en tienda
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PÁGINAS PRINCIPALES
// ============================================================================

/**
 * Página principal de búsqueda
 */
export const SearchPage = () => {
  const { products, loading, error, search, clearSearch } = useProductSearch();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSearch = (query) => {
    search(query);
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    // Navegar a página de comparación o mostrar modal
    window.location.href = `/product/${productId}`;
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <SearchBar onSearch={handleSearch} loading={loading} />
        <button onClick={clearSearch} className="clear-button">
          Limpiar
        </button>
      </div>
      
      <ProductList 
        products={products}
        onProductSelect={handleProductSelect}
        loading={loading}
        error={error}
      />
    </div>
  );
};

/**
 * Página de comparación de producto
 */
export const ProductComparisonPage = ({ baseProductId }) => {
  const { comparison, loading, error } = useProductComparison(baseProductId);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando comparación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={() => window.history.back()}>
          Volver
        </button>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="no-results">
        <p>Producto no encontrado</p>
      </div>
    );
  }

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

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

/**
 * Formatear precio para mostrar
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

/**
 * Debounce para búsqueda
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para búsqueda con debounce
 */
export const useDebouncedSearch = (delay = 500) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);
  const { products, loading, error, search } = useProductSearch();

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    products,
    loading,
    error
  };
};

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================

// Ejemplo 1: Búsqueda básica
const exampleBasicSearch = async () => {
  try {
    const results = await productSearchService.searchProducts('toalla papel');
    console.log(`Encontrados ${results.data.length} productos`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
};

// Ejemplo 2: Búsqueda por marca
const exampleBrandSearch = async () => {
  try {
    const results = await productSearchService.searchByBrand('nova');
    console.log(`Encontrados ${results.data.length} productos Nova`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda por marca:', error);
  }
};

// Ejemplo 3: Comparación de producto
const exampleProductComparison = async () => {
  try {
    const comparison = await productSearchService.getProductComparison('3383e40e-b89c-4dec-af6e-aa03e43353da');
    console.log(`Producto disponible en ${comparison.stores.length} tiendas`);
    console.log(`Rango de precios: $${comparison.priceRange.min} - $${comparison.priceRange.max}`);
    return comparison;
  } catch (error) {
    console.error('Error en comparación:', error);
  }
};

// Ejemplo 4: Obtener productos con múltiples tiendas
const exampleMultiStoreProducts = async () => {
  try {
    const multiStoreProducts = await productSearchService.getMultiStoreProducts('toalla papel');
    console.log(`Productos con múltiples tiendas: ${multiStoreProducts.length}`);
    return multiStoreProducts;
  } catch (error) {
    console.error('Error obteniendo productos multi-tienda:', error);
  }
};

// ============================================================================
// CONFIGURACIÓN DE RUTAS (React Router)
// ============================================================================

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductComparisonPage />} />
      </Routes>
    </Router>
  );
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

export {
  authService,
  productSearchService,
  API_CONFIG
};

export default {
  authService,
  productSearchService,
  API_CONFIG,
  useProductSearch,
  useProductComparison,
  useDebouncedSearch,
  SearchBar,
  ProductCard,
  ProductList,
  ProductComparison,
  StoreCard,
  SearchPage,
  ProductComparisonPage,
  AppRoutes,
  formatPrice,
  useDebounce
};

