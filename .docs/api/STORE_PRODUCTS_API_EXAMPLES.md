# 🏪 Store Products API - Practical Examples

*This document provides practical examples for implementing the Store Products API in various scenarios. For complete API documentation, see `STORE_PRODUCTS_API_ENDPOINTS.md`.*

*Last updated: 2024-01-15*
*API Version: 1.0*

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [JavaScript/TypeScript Examples](#javascripttypescript-examples)
- [React Hooks](#react-hooks)
- [Vue.js Examples](#vuejs-examples)
- [Common Use Cases](#common-use-cases)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### Basic Setup

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_ENDPOINTS = {
  storeProducts: `${API_BASE_URL}/store-products`,
  priceComparison: `${API_BASE_URL}/store-products/price-comparison`,
  scraping: `${API_BASE_URL}/store-products/scraping`,
  analytics: `${API_BASE_URL}/store-products/analytics`
};

// Authentication helper
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
```

## 💻 JavaScript/TypeScript Examples

### 1. Create Store Product

```javascript
/**
 * Creates a new store product relationship
 */
async function createStoreProduct(token, storeProductData) {
  try {
    const response = await fetch(API_ENDPOINTS.storeProducts, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(storeProductData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create store product');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating store product:', error);
    throw error;
  }
}

// Usage example
const storeProductData = {
  storeId: 'uuid-store-id',
  productId: 'uuid-product-id',
  name: 'iPhone 15 Pro - Space Black 256GB',
  description: 'Latest iPhone with advanced features',
  url: 'https://store.com/iphone-15-pro',
  onlinePrice: 999.99,
  physicalPrice: 999.99,
  currency: 'USD',
  availability: 'in_stock',
  status: 'active',
  stockQuantity: 50,
  scrapingIntervalHours: 24
};

const newStoreProduct = await createStoreProduct(token, storeProductData);
console.log('Created store product:', newStoreProduct);
```

### 2. Get Store Products with Filtering

```javascript
/**
 * Retrieves store products with advanced filtering
 */
async function getStoreProducts(token, filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_ENDPOINTS.storeProducts}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch store products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching store products:', error);
    throw error;
  }
}

// Usage examples
const allProducts = await getStoreProducts(token);
const filteredProducts = await getStoreProducts(token, {
  storeId: 'uuid-store-id',
  status: 'active',
  availability: 'in_stock',
  minPrice: 100,
  maxPrice: 1000,
  page: 1,
  limit: 20
});
```

### 3. Price Comparison

```javascript
/**
 * Gets price comparison for a product across all stores
 */
async function getPriceComparison(token, productId, options = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.currency) queryParams.append('currency', options.currency);
    if (options.includeOutOfStock) queryParams.append('includeOutOfStock', 'true');

    const url = `${API_ENDPOINTS.priceComparison}/${productId}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch price comparison');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    throw error;
  }
}

// Usage example
const priceComparison = await getPriceComparison(token, 'uuid-product-id', {
  currency: 'USD',
  includeOutOfStock: false
});

console.log('Best price:', priceComparison.bestPrice);
console.log('Price range:', priceComparison.priceRange);
```

### 4. Update Store Product

```javascript
/**
 * Updates an existing store product
 */
async function updateStoreProduct(token, storeProductId, updateData) {
  try {
    const response = await fetch(`${API_ENDPOINTS.storeProducts}/${storeProductId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update store product');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating store product:', error);
    throw error;
  }
}

// Usage example
const updateData = {
  onlinePrice: 899.99,
  physicalPrice: 899.99,
  stockQuantity: 25,
  isOnSale: true,
  discountPercentage: 10.0
};

const updatedProduct = await updateStoreProduct(token, 'uuid-store-product-id', updateData);
```

### 5. Scraping Management

```javascript
/**
 * Starts scraping for a store product
 */
async function startScraping(token, storeProductId) {
  try {
    const response = await fetch(`${API_ENDPOINTS.scraping}/start/${storeProductId}`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to start scraping');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting scraping:', error);
    throw error;
  }
}

/**
 * Gets scraping jobs
 */
async function getScrapingJobs(token, filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const url = `${API_ENDPOINTS.scraping}/jobs?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch scraping jobs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scraping jobs:', error);
    throw error;
  }
}

// Usage examples
const scrapingResult = await startScraping(token, 'uuid-store-product-id');
const pendingJobs = await getScrapingJobs(token, { status: 'pending' });
```

### 6. Analytics

```javascript
/**
 * Gets store products analytics
 */
async function getStoreProductsAnalytics(token, filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const url = `${API_ENDPOINTS.analytics}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(token)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// Usage example
const analytics = await getStoreProductsAnalytics(token, {
  storeId: 'uuid-store-id',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31'
});
```

## ⚛️ React Hooks

### 1. Store Products Hook

```jsx
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing store products
 */
export function useStoreProducts(token) {
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchStoreProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${API_ENDPOINTS.storeProducts}?${queryParams.toString()}`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store products');
      }

      const data = await response.json();
      setStoreProducts(data.storeProducts);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createStoreProduct = useCallback(async (storeProductData) => {
    try {
      const response = await fetch(API_ENDPOINTS.storeProducts, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(storeProductData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create store product');
      }

      const newProduct = await response.json();
      setStoreProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  const updateStoreProduct = useCallback(async (storeProductId, updateData) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.storeProducts}/${storeProductId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update store product');
      }

      const updatedProduct = await response.json();
      setStoreProducts(prev => 
        prev.map(product => 
          product.id === storeProductId ? updatedProduct : product
        )
      );
      return updatedProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  const deleteStoreProduct = useCallback(async (storeProductId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.storeProducts}/${storeProductId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to delete store product');
      }

      setStoreProducts(prev => prev.filter(product => product.id !== storeProductId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  return {
    storeProducts,
    loading,
    error,
    pagination,
    fetchStoreProducts,
    createStoreProduct,
    updateStoreProduct,
    deleteStoreProduct
  };
}
```

### 2. Price Comparison Hook

```jsx
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for price comparison
 */
export function usePriceComparison(token) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPriceComparison = useCallback(async (productId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (options.currency) queryParams.append('currency', options.currency);
      if (options.includeOutOfStock) queryParams.append('includeOutOfStock', 'true');

      const url = `${API_ENDPOINTS.priceComparison}/${productId}?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch price comparison');
      }

      const data = await response.json();
      setComparison(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    comparison,
    loading,
    error,
    getPriceComparison
  };
}
```

### 3. Scraping Management Hook

```jsx
import { useState, useCallback } from 'react';

/**
 * Custom hook for scraping management
 */
export function useScraping(token) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startScraping = useCallback(async (storeProductId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.scraping}/start/${storeProductId}`, {
        method: 'POST',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getScrapingJobs = useCallback(async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const url = `${API_ENDPOINTS.scraping}/jobs?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scraping jobs');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  return {
    loading,
    error,
    startScraping,
    getScrapingJobs
  };
}
```

### 4. React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { useStoreProducts, usePriceComparison } from './hooks/storeProducts';

/**
 * Store Products Management Component
 */
export function StoreProductsManager({ token }) {
  const {
    storeProducts,
    loading,
    error,
    pagination,
    fetchStoreProducts,
    createStoreProduct,
    updateStoreProduct,
    deleteStoreProduct
  } = useStoreProducts(token);

  const { comparison, getPriceComparison } = usePriceComparison(token);

  const [filters, setFilters] = useState({
    storeId: '',
    status: '',
    availability: '',
    minPrice: '',
    maxPrice: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchStoreProducts(filters);
  }, [fetchStoreProducts, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePriceComparison = async (productId) => {
    try {
      await getPriceComparison(productId);
      setSelectedProduct(productId);
    } catch (error) {
      console.error('Error fetching price comparison:', error);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      await createStoreProduct(productData);
      // Refresh the list
      fetchStoreProducts(filters);
    } catch (error) {
      console.error('Error creating store product:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="store-products-manager">
      <h2>Store Products Management</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Store ID"
          value={filters.storeId}
          onChange={(e) => handleFilterChange('storeId', e.target.value)}
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
        />
      </div>

      {/* Store Products List */}
      <div className="store-products-list">
        {storeProducts.map(product => (
          <div key={product.id} className="store-product-card">
            <h3>{product.name}</h3>
            <p>Store: {product.storeName}</p>
            <p>Price: ${product.onlinePrice} {product.currency}</p>
            <p>Status: {product.status}</p>
            <p>Availability: {product.availability}</p>
            <button onClick={() => handlePriceComparison(product.productId)}>
              Compare Prices
            </button>
          </div>
        ))}
      </div>

      {/* Price Comparison Modal */}
      {comparison && selectedProduct && (
        <div className="price-comparison-modal">
          <h3>Price Comparison: {comparison.productName}</h3>
          <div className="price-range">
            <p>Price Range: ${comparison.priceRange.min} - ${comparison.priceRange.max}</p>
            <p>Average Price: ${comparison.priceRange.average}</p>
          </div>
          <div className="best-price">
            <h4>Best Price:</h4>
            <p>{comparison.bestPrice.storeName}: ${comparison.bestPrice.price}</p>
          </div>
          <div className="stores-list">
            {comparison.stores.map(store => (
              <div key={store.storeId} className="store-price">
                <h4>{store.storeName}</h4>
                <p>Online: ${store.onlinePrice}</p>
                <p>Physical: ${store.physicalPrice}</p>
                <p>Availability: {store.availability}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setSelectedProduct(null)}>Close</button>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() => fetchStoreProducts({ ...filters, page: pagination.page - 1 })}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => fetchStoreProducts({ ...filters, page: pagination.page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## 🟢 Vue.js Examples

### 1. Vue 3 Composition API

```vue
<template>
  <div class="store-products">
    <h2>Store Products</h2>
    
    <!-- Filters -->
    <div class="filters">
      <input
        v-model="filters.storeId"
        placeholder="Store ID"
        @input="fetchStoreProducts"
      />
      <select v-model="filters.status" @change="fetchStoreProducts">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Error State -->
    <div v-if="error" class="error">Error: {{ error }}</div>

    <!-- Store Products List -->
    <div v-else class="products-list">
      <div
        v-for="product in storeProducts"
        :key="product.id"
        class="product-card"
      >
        <h3>{{ product.name }}</h3>
        <p>Store: {{ product.storeName }}</p>
        <p>Price: ${{ product.onlinePrice }} {{ product.currency }}</p>
        <p>Status: {{ product.status }}</p>
        <button @click="comparePrices(product.productId)">
          Compare Prices
        </button>
      </div>
    </div>

    <!-- Price Comparison -->
    <div v-if="priceComparison" class="price-comparison">
      <h3>Price Comparison: {{ priceComparison.productName }}</h3>
      <div class="best-price">
        Best Price: {{ priceComparison.bestPrice.storeName }} - 
        ${{ priceComparison.bestPrice.price }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// Props
const props = defineProps({
  token: {
    type: String,
    required: true
  }
});

// Reactive data
const storeProducts = ref([]);
const priceComparison = ref(null);
const loading = ref(false);
const error = ref(null);

const filters = reactive({
  storeId: '',
  status: '',
  availability: '',
  minPrice: '',
  maxPrice: ''
});

// Methods
const fetchStoreProducts = async () => {
  loading.value = true;
  error.value = null;

  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(
      `${API_ENDPOINTS.storeProducts}?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(props.token)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch store products');
    }

    const data = await response.json();
    storeProducts.value = data.storeProducts;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const comparePrices = async (productId) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.priceComparison}/${productId}`,
      {
        headers: getAuthHeaders(props.token)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price comparison');
    }

    priceComparison.value = await response.json();
  } catch (err) {
    error.value = err.message;
  }
};

// Lifecycle
onMounted(() => {
  fetchStoreProducts();
});
</script>
```

## 🎯 Common Use Cases

### 1. Product Price Monitoring Dashboard

```javascript
/**
 * Dashboard for monitoring product prices across stores
 */
class PriceMonitoringDashboard {
  constructor(token) {
    this.token = token;
    this.monitoringInterval = null;
  }

  async startMonitoring(productIds, intervalMinutes = 30) {
    this.monitoringInterval = setInterval(async () => {
      for (const productId of productIds) {
        try {
          const comparison = await getPriceComparison(this.token, productId);
          this.updateDashboard(comparison);
        } catch (error) {
          console.error(`Error monitoring product ${productId}:`, error);
        }
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  updateDashboard(comparison) {
    // Update UI with new price data
    console.log(`Price update for ${comparison.productName}:`, comparison.bestPrice);
  }
}

// Usage
const dashboard = new PriceMonitoringDashboard(token);
dashboard.startMonitoring(['product-id-1', 'product-id-2'], 15); // Check every 15 minutes
```

### 2. Bulk Store Product Management

```javascript
/**
 * Utility for bulk operations on store products
 */
class BulkStoreProductManager {
  constructor(token) {
    this.token = token;
  }

  async bulkCreateStoreProducts(storeProductsData) {
    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const productData of storeProductsData) {
      try {
        await createStoreProduct(this.token, productData);
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          productData,
          error: error.message
        });
      }
    }

    return results;
  }

  async bulkUpdatePrices(updates) {
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      try {
        await updateStoreProduct(this.token, update.storeProductId, {
          onlinePrice: update.onlinePrice,
          physicalPrice: update.physicalPrice
        });
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          update,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Usage
const bulkManager = new BulkStoreProductManager(token);
const results = await bulkManager.bulkCreateStoreProducts([
  { storeId: 'store-1', productId: 'product-1', name: 'Product 1', onlinePrice: 100 },
  { storeId: 'store-2', productId: 'product-2', name: 'Product 2', onlinePrice: 200 }
]);
```

### 3. Price Alert System

```javascript
/**
 * Price alert system for store products
 */
class PriceAlertSystem {
  constructor(token) {
    this.token = token;
    this.alerts = new Map();
  }

  addAlert(storeProductId, targetPrice, condition = 'below') {
    this.alerts.set(storeProductId, {
      targetPrice,
      condition,
      triggered: false
    });
  }

  removeAlert(storeProductId) {
    this.alerts.delete(storeProductId);
  }

  async checkAlerts() {
    for (const [storeProductId, alert] of this.alerts) {
      if (alert.triggered) continue;

      try {
        const response = await fetch(
          `${API_ENDPOINTS.storeProducts}/${storeProductId}`,
          { headers: getAuthHeaders(this.token) }
        );

        if (!response.ok) continue;

        const product = await response.json();
        const currentPrice = product.onlinePrice || product.physicalPrice;

        if (this.shouldTriggerAlert(currentPrice, alert)) {
          this.triggerAlert(storeProductId, product, alert);
          alert.triggered = true;
        }
      } catch (error) {
        console.error(`Error checking alert for ${storeProductId}:`, error);
      }
    }
  }

  shouldTriggerAlert(currentPrice, alert) {
    if (alert.condition === 'below') {
      return currentPrice <= alert.targetPrice;
    } else if (alert.condition === 'above') {
      return currentPrice >= alert.targetPrice;
    }
    return false;
  }

  triggerAlert(storeProductId, product, alert) {
    console.log(`🚨 Price Alert: ${product.name} is now $${product.onlinePrice} (${alert.condition} $${alert.targetPrice})`);
    // Send notification, email, etc.
  }
}

// Usage
const alertSystem = new PriceAlertSystem(token);
alertSystem.addAlert('store-product-id', 500, 'below');
setInterval(() => alertSystem.checkAlerts(), 60000); // Check every minute
```

## ⚠️ Error Handling

### Comprehensive Error Handling

```javascript
/**
 * Enhanced error handling for store products API
 */
class StoreProductsAPIError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'StoreProductsAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function handleAPIRequest(requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error instanceof Response) {
      const errorData = await error.json().catch(() => ({}));
      throw new StoreProductsAPIError(
        errorData.message || 'API request failed',
        error.status,
        errorData.code,
        errorData
      );
    }
    throw error;
  }
}

// Usage with error handling
try {
  const storeProduct = await handleAPIRequest(() => 
    createStoreProduct(token, storeProductData)
  );
  console.log('Store product created:', storeProduct);
} catch (error) {
  if (error instanceof StoreProductsAPIError) {
    switch (error.status) {
      case 400:
        console.error('Bad request:', error.message);
        break;
      case 401:
        console.error('Unauthorized - please login again');
        break;
      case 403:
        console.error('Forbidden - insufficient permissions');
        break;
      case 404:
        console.error('Store product not found');
        break;
      case 500:
        console.error('Server error - please try again later');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
  } else {
    console.error('Network or other error:', error.message);
  }
}
```

## 🏆 Best Practices

### 1. Caching Strategy

```javascript
/**
 * Simple caching mechanism for store products
 */
class StoreProductsCache {
  constructor(ttlMinutes = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Usage with caching
const cache = new StoreProductsCache(5); // 5 minutes TTL

async function getStoreProductsWithCache(token, filters) {
  const cacheKey = JSON.stringify(filters);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const data = await getStoreProducts(token, filters);
  cache.set(cacheKey, data);
  return data;
}
```

### 2. Retry Logic

```javascript
/**
 * Retry mechanism for failed API requests
 */
async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// Usage with retry
const storeProduct = await retryRequest(() => 
  createStoreProduct(token, storeProductData)
);
```

### 3. TypeScript Interfaces

```typescript
// TypeScript interfaces for better type safety
interface StoreProduct {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productCode: string;
  name: string;
  description?: string;
  url?: string;
  sku?: string;
  storeProductId?: string;
  image?: string;
  onlinePrice?: number;
  physicalPrice?: number;
  currency: string;
  availability: Availability;
  status: StoreProductStatus;
  scrapingStatus: ScrapingStatus;
  stockQuantity?: number;
  minStockLevel?: number;
  isOnSale: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  saleEndDate?: Date;
  specifications?: Record<string, any>;
  features?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  lastScraped?: Date;
  nextScrapingDate?: Date;
  scrapingIntervalHours: number;
  scrapingConfig?: Record<string, any>;
  scrapingHistory?: ScrapingHistoryEntry[];
  priceHistory?: PriceHistoryEntry[];
  availabilityHistory?: AvailabilityHistoryEntry[];
  notes?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  creatorId: string;
  creatorName: string;
  verifierId?: string;
  verifierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PriceComparison {
  productId: string;
  productName: string;
  productCode: string;
  currency: string;
  totalStores: number;
  availableStores: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  stores: StoreProductSummary[];
  bestPrice: {
    storeId: string;
    storeName: string;
    price: number;
    type: 'online' | 'physical';
  };
  priceHistory: PriceHistoryTrend[];
}

// Usage with TypeScript
async function createStoreProductTyped(
  token: string, 
  data: CreateStoreProductDto
): Promise<StoreProduct> {
  const response = await fetch(API_ENDPOINTS.storeProducts, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create store product');
  }

  return response.json();
}
```

This comprehensive documentation provides everything the frontend team needs to implement the Store Products API effectively, including practical examples, error handling, and best practices.



















