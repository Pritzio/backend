# 🛍️ Products API - Practical Examples

## 📋 Overview

This document provides practical examples and use cases for the Products API, showing real-world scenarios that frontend developers might encounter.

## 🎯 Common Use Cases

### 1. **Product Catalog Management**

#### **Scenario**: Display a product catalog with filtering and pagination

```javascript
// Get products for a product catalog page
const getProductCatalog = async (page = 1, filters = {}) => {
  const params = {
    page,
    limit: 20,
    status: 'active', // Only show active products
    ...filters
  };
  
  const response = await fetch(`/api/v1/products?${new URLSearchParams(params)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usage examples
const electronics = await getProductCatalog(1, { category: 'Electronics' });
const smartphones = await getProductCatalog(1, { 
  category: 'Electronics', 
  subcategory: 'Smartphones' 
});
const searchResults = await getProductCatalog(1, { search: 'iPhone' });
```

#### **React Component Example**
```jsx
import React, { useState, useEffect } from 'react';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProductCatalog(filters.page, filters);
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return (
    <div>
      {/* Filter controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
        </select>
      </div>

      {/* Product grid */}
      <div className="product-grid">
        {loading ? (
          <div>Loading...</div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.brand}</p>
              <p>{product.category}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

### 2. **Bulk Product Import (Scraping Integration)**

#### **Scenario**: Import products from external sources (scraping, CSV, etc.)

```javascript
// Import products from scraping data
const importScrapedProducts = async (scrapedData) => {
  const products = scrapedData.map(item => ({
    name: item.title,
    code: item.sku || generateCode(item.title),
    category: item.category,
    subcategory: item.subcategory,
    brand: item.brand,
    type: 'physical',
    status: 'active',
    condition: 'new',
    description: item.description,
    specifications: item.specifications,
    features: item.features,
    tags: item.tags,
    metadata: {
      scrapingSource: item.source,
      scrapingPriority: item.priority || 'medium',
      originalUrl: item.url
    }
  }));

  const response = await fetch('/api/v1/products/bulk/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      products,
      options: {
        skipDuplicates: true,
        validateOnly: false
      }
    })
  });

  return await response.json();
};

// Helper function to generate product codes
const generateCode = (name) => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 20);
};
```

#### **Bulk Import with Progress Tracking**
```javascript
const importProductsWithProgress = async (products, onProgress) => {
  const batchSize = 50; // Process in batches of 50
  const batches = [];
  
  // Split products into batches
  for (let i = 0; i < products.length; i += batchSize) {
    batches.push(products.slice(i, i + batchSize));
  }
  
  let totalCreated = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const result = await importScrapedProducts(batch);
      
      if (result.success) {
        totalCreated += result.data.created;
        totalFailed += result.data.failed;
        
        // Report progress
        onProgress({
          batch: i + 1,
          totalBatches: batches.length,
          created: totalCreated,
          failed: totalFailed,
          currentBatch: result.data
        });
      }
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      totalFailed += batch.length;
    }
  }
  
  return {
    totalCreated,
    totalFailed,
    totalProcessed: products.length
  };
};
```

### 3. **Product Management Dashboard**

#### **Scenario**: Admin dashboard for managing products

```javascript
// Get products for admin management
const getAdminProducts = async (filters = {}) => {
  const params = {
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...filters
  };
  
  const response = await fetch(`/api/v1/products/admin?${new URLSearchParams(params)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Bulk operations for admin
const bulkUpdateProductStatus = async (productIds, status) => {
  const response = await fetch(`/api/v1/products/bulk/${status}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productIds })
  });
  
  return await response.json();
};
```

#### **Admin Dashboard Component**
```jsx
import React, { useState, useEffect } from 'react';

const AdminProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return;
    
    try {
      const result = await bulkUpdateProductStatus(selectedProducts, action);
      if (result.success) {
        alert(`Successfully ${action}d ${result.data.updated} products`);
        setSelectedProducts([]);
        fetchProducts(); // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action}ing products:`, error);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div>
      <div className="bulk-actions">
        <button 
          onClick={() => handleBulkAction('activate')}
          disabled={selectedProducts.length === 0}
        >
          Activate Selected ({selectedProducts.length})
        </button>
        <button 
          onClick={() => handleBulkAction('deactivate')}
          disabled={selectedProducts.length === 0}
        >
          Deactivate Selected ({selectedProducts.length})
        </button>
        <button 
          onClick={() => handleBulkAction('delete')}
          disabled={selectedProducts.length === 0}
        >
          Delete Selected ({selectedProducts.length})
        </button>
      </div>

      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-row">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => handleSelectProduct(product.id)}
            />
            <span>{product.name}</span>
            <span>{product.code}</span>
            <span className={`status ${product.status}`}>{product.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. **Scraping Integration**

#### **Scenario**: Automated scraping workflow

```javascript
// Get products that need scraping
const getProductsForScraping = async (options = {}) => {
  const params = {
    limit: options.limit || 50,
    priority: options.priority || 'high',
    ...options
  };
  
  const response = await fetch(`/api/v1/products/scraping/ready?${new URLSearchParams(params)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Update scraping results
const updateScrapingResults = async (productId, scrapingData) => {
  const response = await fetch('/api/v1/products/scraping/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      scrapingData
    })
  });
  
  return await response.json();
};
```

#### **Scraping Workflow Example**
```javascript
const scrapingWorkflow = async () => {
  try {
    // 1. Get products that need scraping
    const productsToScrape = await getProductsForScraping({
      limit: 100,
      priority: 'high',
      lastScrapedBefore: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
    });
    
    if (!productsToScrape.success) {
      throw new Error('Failed to get products for scraping');
    }
    
    console.log(`Found ${productsToScrape.data.length} products to scrape`);
    
    // 2. Process each product (simulate scraping)
    for (const product of productsToScrape.data) {
      try {
        // Simulate scraping process
        const scrapingResult = await simulateScraping(product);
        
        // 3. Update product with scraping results
        await updateScrapingResults(product.id, {
          lastScraped: new Date().toISOString(),
          scrapingSource: 'automated_scraper',
          scrapingStatus: 'completed',
          scrapingMetadata: {
            price: scrapingResult.price,
            availability: scrapingResult.availability,
            rating: scrapingResult.rating,
            reviews: scrapingResult.reviews
          },
          scrapingErrors: []
        });
        
        console.log(`Updated product: ${product.name}`);
        
      } catch (error) {
        // Update with error information
        await updateScrapingResults(product.id, {
          lastScraped: new Date().toISOString(),
          scrapingSource: 'automated_scraper',
          scrapingStatus: 'failed',
          scrapingErrors: [error.message]
        });
        
        console.error(`Failed to scrape product ${product.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Scraping workflow failed:', error);
  }
};

// Simulate scraping (replace with actual scraping logic)
const simulateScraping = async (product) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    price: Math.random() * 1000 + 100,
    availability: Math.random() > 0.1 ? 'in_stock' : 'out_of_stock',
    rating: Math.random() * 2 + 3, // 3-5 stars
    reviews: Math.floor(Math.random() * 1000)
  };
};
```

### 5. **Product Search and Filtering**

#### **Scenario**: Advanced product search with multiple filters

```javascript
// Advanced product search
const searchProducts = async (searchParams) => {
  const params = {
    page: searchParams.page || 1,
    limit: searchParams.limit || 20,
    ...searchParams
  };
  
  // Remove empty values
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });
  
  const response = await fetch(`/api/v1/products?${new URLSearchParams(params)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

#### **Advanced Search Component**
```jsx
import React, { useState } from 'react';

const AdvancedProductSearch = () => {
  const [searchParams, setSearchParams] = useState({
    search: '',
    category: '',
    subcategory: '',
    brand: '',
    type: '',
    status: '',
    condition: '',
    hasWarranty: '',
    minWeight: '',
    maxWeight: '',
    tags: '',
    features: ''
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchProducts(searchParams);
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="advanced-search">
      <div className="search-form">
        <input
          type="text"
          placeholder="Search products..."
          value={searchParams.search}
          onChange={(e) => handleInputChange('search', e.target.value)}
        />
        
        <select
          value={searchParams.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Home & Garden">Home & Garden</option>
        </select>
        
        <select
          value={searchParams.brand}
          onChange={(e) => handleInputChange('brand', e.target.value)}
        >
          <option value="">All Brands</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Sony">Sony</option>
        </select>
        
        <select
          value={searchParams.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        
        <div className="weight-range">
          <input
            type="number"
            placeholder="Min Weight"
            value={searchParams.minWeight}
            onChange={(e) => handleInputChange('minWeight', e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Weight"
            value={searchParams.maxWeight}
            onChange={(e) => handleInputChange('maxWeight', e.target.value)}
          />
        </div>
        
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={searchParams.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
        />
        
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {results && (
        <div className="search-results">
          <p>Found {results.total} products</p>
          <div className="product-grid">
            {results.products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>{product.brand} - {product.category}</p>
                <p>Code: {product.code}</p>
                <span className={`status ${product.status}`}>{product.status}</span>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={!results.hasPrev}
              onClick={() => handleSearch({...searchParams, page: results.page - 1})}
            >
              Previous
            </button>
            <span>Page {results.page} of {results.totalPages}</span>
            <button 
              disabled={!results.hasNext}
              onClick={() => handleSearch({...searchParams, page: results.page + 1})}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 6. **Error Handling and Retry Logic**

#### **Scenario**: Robust error handling for API calls

```javascript
// Retry utility function
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Robust product creation with retry
const createProductWithRetry = async (productData) => {
  return await retryApiCall(async () => {
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Unknown error');
    }
    
    return data;
  });
};

// Error handling wrapper
const handleApiError = (error) => {
  if (error.message.includes('401')) {
    // Handle unauthorized - redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Handle forbidden - show permission error
    alert('You do not have permission to perform this action');
  } else if (error.message.includes('404')) {
    // Handle not found
    alert('Product not found');
  } else if (error.message.includes('409')) {
    // Handle conflict (duplicate)
    alert('Product with this code already exists');
  } else {
    // Handle other errors
    alert('An error occurred. Please try again.');
  }
};
```

## 🔧 Utility Functions

### **Common Helper Functions**

```javascript
// Format product data for display
const formatProductForDisplay = (product) => {
  return {
    ...product,
    displayName: product.name,
    displayCode: product.code,
    displayStatus: product.status.charAt(0).toUpperCase() + product.status.slice(1),
    displayCategory: product.category,
    displayBrand: product.brand || 'Unknown Brand',
    hasWarranty: product.warrantyMonths > 0,
    warrantyText: product.warrantyMonths > 0 ? `${product.warrantyMonths} months` : 'No warranty',
    dimensions: product.hasDimensions ? 
      `${product.length}×${product.width}×${product.height} ${product.dimensionUnit}` : 
      'No dimensions',
    weight: product.hasWeight ? `${product.weight} ${product.weightUnit}` : 'No weight'
  };
};

// Validate product data before submission
const validateProductData = (productData) => {
  const errors = [];
  
  if (!productData.name || productData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!productData.code || productData.code.trim().length < 3) {
    errors.push('Code must be at least 3 characters long');
  }
  
  if (!productData.category || productData.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (productData.weight && productData.weight < 0) {
    errors.push('Weight cannot be negative');
  }
  
  if (productData.warrantyMonths && (productData.warrantyMonths < 0 || productData.warrantyMonths > 120)) {
    errors.push('Warranty must be between 0 and 120 months');
  }
  
  return errors;
};

// Generate product code from name
const generateProductCode = (name, brand = '') => {
  const cleanName = name.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const cleanBrand = brand.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  const prefix = cleanBrand ? cleanBrand.substring(0, 3) : 'PRD';
  const suffix = cleanName.substring(0, 8);
  
  return `${prefix}-${suffix}`;
};

// Format API response for UI
const formatApiResponse = (response) => {
  if (response.success) {
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  } else {
    return {
      success: false,
      error: response.error?.message || 'Unknown error',
      details: response.error?.details || []
    };
  }
};
```

## 📱 Mobile-First Examples

### **React Native Example**

```javascript
// React Native API service
import AsyncStorage from '@react-native-async-storage/async-storage';

class ProductsApiService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/v1/products';
  }

  async getAuthToken() {
    return await AsyncStorage.getItem('auth_token');
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    return await response.json();
  }

  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return await this.makeRequest(`?${queryParams}`);
  }

  async createProduct(productData) {
    return await this.makeRequest('', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async bulkCreateProducts(products, options = {}) {
    return await this.makeRequest('/bulk/create', {
      method: 'POST',
      body: JSON.stringify({ products, options })
    });
  }
}

export default new ProductsApiService();
```

---

*This document provides practical examples for implementing the Products API in various frontend scenarios. For complete API documentation, see `PRODUCTS_API_ENDPOINTS.md`.*

