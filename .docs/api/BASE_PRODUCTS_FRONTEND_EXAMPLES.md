# Base Products Frontend Implementation Examples

## Overview
Este documento proporciona ejemplos prácticos de implementación en el frontend para la administración de productos base.

## 1. Configuración Base

### 1.1 API Client Configuration
```typescript
// api/client.ts
class ApiClient {
  private baseURL = 'http://localhost:3000/api/v1';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Base Products
  async getBaseProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
    isActive?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/admin/products/base-products?${searchParams}`);
  }

  async getBaseProduct(id: string) {
    return this.request(`/admin/products/base-product/${id}`);
  }

  async createBaseProduct(data: {
    name: string;
    brand?: string;
    model?: string;
    sku?: string;
    specifications?: Record<string, any>;
    isActive?: boolean;
  }) {
    return this.request('/admin/products/base-product', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBaseProduct(id: string, data: Partial<{
    name: string;
    brand: string;
    model: string;
    sku: string;
    specifications: Record<string, any>;
    isActive: boolean;
  }>) {
    return this.request(`/admin/products/base-product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBaseProduct(id: string) {
    return this.request(`/admin/products/base-product/${id}`, {
      method: 'DELETE',
    });
  }

  async hardDeleteBaseProduct(id: string) {
    return this.request(`/admin/products/base-product/${id}/hard`, {
      method: 'DELETE',
    });
  }

  // Store Products
  async getUnassociatedStoreProducts(params?: {
    page?: number;
    limit?: number;
    storeId?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/admin/products/store-products/unassociated?${searchParams}`);
  }

  async associateStoreProduct(storeProductId: string, baseProductId: string) {
    return this.request('/admin/products/associate-store-product', {
      method: 'POST',
      body: JSON.stringify({ storeProductId, baseProductId }),
    });
  }

  async disassociateStoreProduct(storeProductId: string) {
    return this.request('/admin/products/disassociate-store-product', {
      method: 'POST',
      body: JSON.stringify({ storeProductId }),
    });
  }

  // Product Matching
  async getDuplicates(threshold = 0.8, limit = 50) {
    return this.request(`/admin/products/duplicates?threshold=${threshold}&limit=${limit}`);
  }

  async mergeProducts(targetProductId: string, duplicateProductIds: string[], mergeData?: any) {
    return this.request('/admin/products/merge', {
      method: 'POST',
      body: JSON.stringify({
        targetProductId,
        duplicateProductIds,
        mergeData,
      }),
    });
  }

  async getAssociationSuggestions(storeProductId: string, limit = 10, threshold = 0.7) {
    return this.request(`/admin/products/suggest-associations?storeProductId=${storeProductId}&limit=${limit}&threshold=${threshold}`);
  }

  async getUnassociatedWithSuggestions(params?: {
    page?: number;
    limit?: number;
    storeId?: string;
    search?: string;
    includeSuggestions?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/admin/products/store-products/unassociated-with-suggestions?${searchParams}`);
  }

  // Product Comparison
  async searchProducts(params: {
    q: string;
    brand?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/product-comparison/search?${searchParams}`);
  }

  async getProductComparison(id: string) {
    return this.request(`/product-comparison/${id}`);
  }
}

export const apiClient = new ApiClient();
```

## 2. React Components

### 2.1 Base Products List Component
```typescript
// components/BaseProductsList.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface BaseProduct {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  fullName: string;
  isActive: boolean;
  storeCount: number;
  totalVariants: number;
  createdAt: string;
  storeProducts: Array<{
    id: string;
    name: string;
    price: number;
    store: {
      id: string;
      name: string;
      website: string;
    };
  }>;
}

interface BaseProductsListProps {
  onProductSelect?: (product: BaseProduct) => void;
  onEdit?: (product: BaseProduct) => void;
  onDelete?: (productId: string) => void;
}

export const BaseProductsList: React.FC<BaseProductsListProps> = ({
  onProductSelect,
  onEdit,
  onDelete,
}) => {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    isActive: true,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getBaseProducts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      
      setProducts(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.limit, filters]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBrandFilter = (brand: string) => {
    setFilters(prev => ({ ...prev, brand }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await apiClient.deleteBaseProduct(productId);
        await fetchProducts();
        onDelete?.(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div className="base-products-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          value={filters.brand}
          onChange={(e) => handleBrandFilter(e.target.value)}
        >
          <option value="">Todas las marcas</option>
          <option value="Nova">Nova</option>
          <option value="Scott">Scott</option>
          <option value="Favorita">Favorita</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          Solo activos
        </label>
      </div>

      {loading ? (
        <div className="loading">Cargando productos...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3>{product.name}</h3>
                <div className="product-actions">
                  <button onClick={() => onEdit?.(product)}>Editar</button>
                  <button onClick={() => handleDelete(product.id)}>Eliminar</button>
                </div>
              </div>
              
              <div className="product-info">
                <p><strong>Marca:</strong> {product.brand || 'Sin marca'}</p>
                <p><strong>Modelo:</strong> {product.model || 'Sin modelo'}</p>
                <p><strong>Tiendas:</strong> {product.storeCount}</p>
                <p><strong>Variantes:</strong> {product.totalVariants}</p>
                <p><strong>Estado:</strong> {product.isActive ? 'Activo' : 'Inactivo'}</p>
              </div>

              {product.storeProducts.length > 0 && (
                <div className="store-products">
                  <h4>Productos en tiendas:</h4>
                  <ul>
                    {product.storeProducts.map((storeProduct) => (
                      <li key={storeProduct.id}>
                        {storeProduct.store.name} - ${storeProduct.price}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                className="view-details"
                onClick={() => onProductSelect?.(product)}
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button 
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Anterior
        </button>
        <span>
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <button 
          disabled={pagination.page === pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
```

### 2.2 Product Association Component
```typescript
// components/ProductAssociation.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface StoreProduct {
  id: string;
  name: string;
  price: number;
  store: {
    id: string;
    name: string;
    website: string;
  };
}

interface AssociationSuggestion {
  storeProduct: StoreProduct;
  suggestedBaseProduct: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
  };
  similarity: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ProductAssociationProps {
  storeProductId: string;
  onAssociationComplete?: () => void;
}

export const ProductAssociation: React.FC<ProductAssociationProps> = ({
  storeProductId,
  onAssociationComplete,
}) => {
  const [suggestions, setSuggestions] = useState<AssociationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [associating, setAssociating] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAssociationSuggestions(storeProductId);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [storeProductId]);

  const handleAssociate = async (baseProductId: string) => {
    setAssociating(baseProductId);
    try {
      await apiClient.associateStoreProduct(storeProductId, baseProductId);
      onAssociationComplete?.();
    } catch (error) {
      console.error('Error associating product:', error);
    } finally {
      setAssociating(null);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div className="loading">Cargando sugerencias...</div>;
  }

  return (
    <div className="product-association">
      <h3>Sugerencias de asociación</h3>
      
      {suggestions.length === 0 ? (
        <p>No se encontraron sugerencias de asociación.</p>
      ) : (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <div className="suggestion-header">
                <h4>{suggestion.suggestedBaseProduct.name}</h4>
                <div 
                  className="confidence-badge"
                  style={{ backgroundColor: getConfidenceColor(suggestion.confidence) }}
                >
                  {suggestion.confidence.toUpperCase()}
                </div>
              </div>
              
              <div className="suggestion-info">
                <p><strong>Marca:</strong> {suggestion.suggestedBaseProduct.brand || 'Sin marca'}</p>
                <p><strong>Modelo:</strong> {suggestion.suggestedBaseProduct.model || 'Sin modelo'}</p>
                <p><strong>Similitud:</strong> {(suggestion.similarity * 100).toFixed(1)}%</p>
                <p><strong>Razón:</strong> {suggestion.reason}</p>
              </div>

              <button
                className="associate-btn"
                onClick={() => handleAssociate(suggestion.suggestedBaseProduct.id)}
                disabled={associating === suggestion.suggestedBaseProduct.id}
              >
                {associating === suggestion.suggestedBaseProduct.id ? 'Asociando...' : 'Asociar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2.3 Product Comparison Component
```typescript
// components/ProductComparison.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface ProductComparisonItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  fullName: string;
  storeCount: number;
  totalVariants: number;
  image: string | null;
  specifications: {
    rating: number | null;
    categories: string[];
    originalData: Record<string, any>;
  };
  createdAt: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  stores: Array<{
    id: string;
    name: string;
    website: string;
    price: number;
    lastUpdated: string;
  }>;
}

interface ProductComparisonProps {
  searchQuery?: string;
  onProductSelect?: (product: ProductComparisonItem) => void;
}

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  searchQuery = '',
  onProductSelect,
}) => {
  const [products, setProducts] = useState<ProductComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.searchProducts({
        q: searchTerm,
        brand: filters.brand || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
        limit: 20,
      });
      
      setProducts(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      searchProducts();
    }
  }, [searchTerm, filters]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  return (
    <div className="product-comparison">
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar productos para comparar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={searchProducts}>Buscar</button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Marca"
            value={filters.brand}
            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Categoría"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Precio mínimo"
            value={filters.minPrice}
            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Precio máximo"
            value={filters.maxPrice}
            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Buscando productos...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {product.image && (
                <img src={product.image} alt={product.name} className="product-image" />
              )}
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <p><strong>Marca:</strong> {product.brand || 'Sin marca'}</p>
                <p><strong>Modelo:</strong> {product.model || 'Sin modelo'}</p>
                
                <div className="price-info">
                  <p><strong>Precio:</strong> {formatPrice(product.priceRange.min)} - {formatPrice(product.priceRange.max)}</p>
                  <p><strong>Promedio:</strong> {formatPrice(product.priceRange.average)}</p>
                </div>

                <div className="availability-info">
                  <p><strong>Tiendas:</strong> {product.storeCount}</p>
                  <p><strong>Variantes:</strong> {product.totalVariants}</p>
                </div>

                {product.specifications.rating && (
                  <div className="rating">
                    <span>⭐ {product.specifications.rating}/5</span>
                  </div>
                )}

                <div className="categories">
                  {product.specifications.categories.map((category, index) => (
                    <span key={index} className="category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                className="compare-btn"
                onClick={() => onProductSelect?.(product)}
              >
                Comparar
              </button>
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && !loading && searchTerm && (
        <div className="no-results">
          <p>No se encontraron productos para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
```

## 3. CSS Styles

### 3.1 Base Products List Styles
```css
/* styles/BaseProductsList.css */
.base-products-list {
  padding: 20px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.filters input,
.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.product-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  flex: 1;
}

.product-actions {
  display: flex;
  gap: 8px;
}

.product-actions button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.product-actions button:hover {
  background: #f5f5f5;
}

.product-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.store-products {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.store-products h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.store-products ul {
  margin: 0;
  padding-left: 20px;
}

.store-products li {
  font-size: 13px;
  color: #666;
  margin: 3px 0;
}

.view-details {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
}

.view-details:hover {
  background: #0056b3;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

### 3.2 Product Association Styles
```css
/* styles/ProductAssociation.css */
.product-association {
  padding: 20px;
}

.suggestions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.suggestion-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.suggestion-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
  flex: 1;
}

.confidence-badge {
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.suggestion-info p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

.associate-btn {
  width: 100%;
  padding: 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.associate-btn:hover {
  background: #218838;
}

.associate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### 3.3 Product Comparison Styles
```css
/* styles/ProductComparison.css */
.product-comparison {
  padding: 20px;
}

.search-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-bar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-bar button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar button:hover {
  background: #0056b3;
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 15px;
}

.product-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.product-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.price-info {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.availability-info {
  display: flex;
  gap: 20px;
  margin: 10px 0;
}

.rating {
  margin: 10px 0;
}

.rating span {
  background: #ffc107;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 10px 0;
}

.category-tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.compare-btn {
  width: 100%;
  padding: 10px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
}

.compare-btn:hover {
  background: #138496;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

## 4. Usage Examples

### 4.1 Main Admin Page
```typescript
// pages/AdminProducts.tsx
import React, { useState } from 'react';
import { BaseProductsList } from '../components/BaseProductsList';
import { ProductAssociation } from '../components/ProductAssociation';
import { ProductComparison } from '../components/ProductComparison';

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'association' | 'comparison'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <div className="admin-products">
      <div className="tabs">
        <button 
          className={activeTab === 'list' ? 'active' : ''}
          onClick={() => setActiveTab('list')}
        >
          Lista de Productos
        </button>
        <button 
          className={activeTab === 'association' ? 'active' : ''}
          onClick={() => setActiveTab('association')}
        >
          Asociación de Productos
        </button>
        <button 
          className={activeTab === 'comparison' ? 'active' : ''}
          onClick={() => setActiveTab('comparison')}
        >
          Comparación de Productos
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'list' && (
          <BaseProductsList
            onProductSelect={setSelectedProduct}
            onEdit={(product) => console.log('Edit product:', product)}
            onDelete={(productId) => console.log('Delete product:', productId)}
          />
        )}
        
        {activeTab === 'association' && (
          <ProductAssociation
            storeProductId="example-store-product-id"
            onAssociationComplete={() => console.log('Association completed')}
          />
        )}
        
        {activeTab === 'comparison' && (
          <ProductComparison
            searchQuery="nova"
            onProductSelect={(product) => console.log('Selected product:', product)}
          />
        )}
      </div>
    </div>
  );
};
```

Esta documentación proporciona una base sólida para implementar la administración de productos base en el frontend, con ejemplos prácticos y estilos CSS incluidos.

