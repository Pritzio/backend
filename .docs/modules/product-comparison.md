# 🔍 Product Comparison Module - User Guide

*This document provides comprehensive user documentation for the Product Comparison module, including features, usage examples, and integration guides.*

*Last updated: 2025-01-27*
*Module Version: 1.0*

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Integration Guides](#integration-guides)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Product Comparison Module enables automatic product matching and price comparison across multiple stores. It uses intelligent similarity algorithms to group identical products from different stores, allowing users to find the best prices and compare options easily.

### **What This Module Does**

- **Automatic Product Matching**: Groups identical products from different stores using similarity algorithms
- **Price Comparison**: Shows prices across multiple stores for the same product
- **Search Functionality**: Find products by name, brand, or description
- **Real-time Updates**: Live price updates from scraping operations
- **Store Analytics**: Track which stores carry specific products

### **Who Should Use This Module**

- **Consumers**: Find the best prices for products they want to buy
- **E-commerce Platforms**: Compare prices with competitors
- **Price Monitoring Services**: Track price changes across stores
- **Market Research**: Analyze pricing strategies and market trends

## ✨ Key Features

### **1. Intelligent Product Matching**

The system automatically groups identical products using:
- **Text Normalization**: Removes special characters, normalizes spaces
- **Similarity Algorithm**: Jaro-Winkler algorithm for name and brand matching
- **80% Similarity Threshold**: Ensures accurate matching while avoiding false positives
- **Batch Processing**: Efficient processing of multiple products

### **2. Comprehensive Price Comparison**

- **Multi-store Comparison**: Compare prices across all available stores
- **Price Range Analysis**: Shows minimum, maximum, and average prices
- **Store Verification**: Indicates which stores are verified and trustworthy
- **Real-time Updates**: Prices updated during scraping operations

### **3. Advanced Search Capabilities**

- **Fuzzy Search**: Find products even with slight variations in names
- **Brand-based Search**: Search by brand name or product category
- **Partial Matching**: Find products with incomplete or partial names
- **Case-insensitive**: Search works regardless of capitalization

### **4. Store Analytics**

- **Store Performance**: Track which stores offer the best prices
- **Product Availability**: See which stores carry specific products
- **Price Trends**: Monitor price changes over time
- **Verification Status**: Know which stores are verified and reliable

## 🚀 Getting Started

### **Prerequisites**

- Valid JWT authentication token
- Appropriate user role (`SUPER_ADMIN`, `ADMIN`, or `STORE_ADMIN`)
- Access to the Product Comparison API endpoints

### **Basic Setup**

1. **Obtain Authentication Token**
   ```javascript
   // Login to get JWT token
   const response = await fetch('/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       username: 'your-username',
       password: 'your-password'
     })
   });
   const { token } = await response.json();
   ```

2. **Set Up API Client**
   ```javascript
   const apiClient = {
     baseUrl: 'http://localhost:3000/api/v1/product-comparison',
     token: 'your-jwt-token',
     
     async request(endpoint, options = {}) {
       const response = await fetch(`${this.baseUrl}${endpoint}`, {
         headers: {
           'Authorization': `Bearer ${this.token}`,
           'Content-Type': 'application/json',
           ...options.headers
         },
         ...options
       });
       return response.json();
     }
   };
   ```

## 📡 API Endpoints

### **Search Products**

**Endpoint**: `GET /api/v1/product-comparison/search`

Search for products that can be compared across stores.

**Parameters**:
- `q` (string, required): Search query (minimum 2 characters)

**Example**:
```javascript
const results = await apiClient.request('/search?q=nova%20papel%2070m');
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid-base-product-id",
      "name": "nova papel 70m",
      "brand": "nova",
      "model": "70m",
      "fullName": "nova nova papel 70m 70m",
      "storeCount": 3,
      "totalVariants": 5,
      "image": "https://example.com/nova-papel-70m.jpg",
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "total": 1,
  "query": "nova papel 70m"
}
```

### **Get Product Comparison**

**Endpoint**: `GET /api/v1/product-comparison/{id}`

Get detailed price comparison for a specific product across all stores.

**Parameters**:
- `id` (string): Base product ID

**Example**:
```javascript
const comparison = await apiClient.request('/uuid-base-product-id');
```

**Response**:
```json
{
  "product": {
    "id": "uuid-base-product-id",
    "name": "nova papel 70m",
    "brand": "nova",
    "model": "70m",
    "fullName": "nova nova papel 70m 70m",
    "description": "Papel higiénico Nova 70 metros",
    "image": "https://example.com/nova-papel-70m.jpg",
    "specifications": {
      "material": "papel",
      "longitud": "70 metros",
      "hojas": 280
    },
    "storeCount": 3,
    "totalVariants": 5
  },
  "priceRange": {
    "min": 1500,
    "max": 2200,
    "avg": 1850
  },
  "stores": [
    {
      "store": {
        "id": "uuid-store-id-1",
        "name": "Jumbo",
        "website": "https://jumbo.cl",
        "type": "online",
        "isVerified": true
      },
      "product": {
        "id": "uuid-store-product-id-1",
        "name": "Nova Papel 70m",
        "price": 1500,
        "url": "https://jumbo.cl/nova-papel-70m",
        "image": "https://jumbo.cl/images/nova-papel-70m.jpg",
        "lastScraped": "2025-01-27T10:30:00.000Z"
      },
      "price": 1500
    }
  ],
  "totalStores": 3,
  "lastUpdated": "2025-01-27T10:30:00.000Z"
}
```

## 💡 Usage Examples

### **1. Basic Product Search**

```javascript
// Search for products
const searchProducts = async (query) => {
  try {
    const results = await apiClient.request(`/search?q=${encodeURIComponent(query)}`);
    
    if (results.data.length > 0) {
      console.log(`Found ${results.total} products:`);
      results.data.forEach(product => {
        console.log(`- ${product.fullName} (${product.storeCount} stores)`);
      });
    } else {
      console.log('No products found');
    }
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
  }
};

// Usage
searchProducts('nova papel 70m');
```

### **2. Price Comparison**

```javascript
// Compare prices for a product
const comparePrices = async (baseProductId) => {
  try {
    const comparison = await apiClient.request(`/${baseProductId}`);
    
    console.log(`Price comparison for: ${comparison.product.fullName}`);
    console.log(`Price range: $${comparison.priceRange.min} - $${comparison.priceRange.max}`);
    console.log(`Average price: $${comparison.priceRange.avg}`);
    console.log(`Available in ${comparison.totalStores} stores`);
    
    // Sort stores by price (ascending)
    const sortedStores = comparison.stores.sort((a, b) => a.price - b.price);
    
    console.log('\nStores (sorted by price):');
    sortedStores.forEach((storeData, index) => {
      const store = storeData.store;
      const product = storeData.product;
      const badge = index === 0 ? ' 🏆 BEST PRICE' : '';
      const verified = store.isVerified ? ' ✅' : '';
      
      console.log(`${index + 1}. ${store.name}${verified}: $${product.price}${badge}`);
    });
    
    return comparison;
  } catch (error) {
    console.error('Comparison failed:', error);
  }
};
```

### **3. Find Best Deals**

```javascript
// Find the best deals across multiple products
const findBestDeals = async (searchQueries) => {
  const deals = [];
  
  for (const query of searchQueries) {
    try {
      const searchResults = await apiClient.request(`/search?q=${encodeURIComponent(query)}`);
      
      for (const product of searchResults.data) {
        const comparison = await apiClient.request(`/${product.id}`);
        const bestPrice = Math.min(...comparison.stores.map(s => s.price));
        const worstPrice = Math.max(...comparison.stores.map(s => s.price));
        const savings = worstPrice - bestPrice;
        
        deals.push({
          product: product.fullName,
          bestPrice,
          worstPrice,
          savings,
          storeCount: comparison.totalStores
        });
      }
    } catch (error) {
      console.error(`Failed to process query "${query}":`, error);
    }
  }
  
  // Sort by savings (descending)
  deals.sort((a, b) => b.savings - a.savings);
  
  console.log('Best deals (by potential savings):');
  deals.forEach((deal, index) => {
    console.log(`${index + 1}. ${deal.product}`);
    console.log(`   Best: $${deal.bestPrice} | Worst: $${deal.worstPrice} | Save: $${deal.savings}`);
  });
  
  return deals;
};

// Usage
findBestDeals(['nova papel', 'iphone 15', 'samsung galaxy']);
```

### **4. Price Monitoring**

```javascript
// Monitor price changes for specific products
class PriceMonitor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.monitoredProducts = new Map();
  }
  
  addProduct(baseProductId, alertPrice) {
    this.monitoredProducts.set(baseProductId, {
      alertPrice,
      lastPrice: null,
      priceHistory: []
    });
  }
  
  async checkPrices() {
    for (const [baseProductId, config] of this.monitoredProducts) {
      try {
        const comparison = await this.apiClient.request(`/${baseProductId}`);
        const currentPrice = comparison.priceRange.min;
        
        if (config.lastPrice !== null && currentPrice !== config.lastPrice) {
          const priceChange = currentPrice - config.lastPrice;
          const changePercent = (priceChange / config.lastPrice) * 100;
          
          console.log(`Price change for ${comparison.product.fullName}:`);
          console.log(`  ${config.lastPrice} → ${currentPrice} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
          
          // Check if price dropped below alert threshold
          if (currentPrice <= config.alertPrice) {
            console.log(`  🚨 ALERT: Price dropped below $${config.alertPrice}!`);
          }
        }
        
        config.lastPrice = currentPrice;
        config.priceHistory.push({
          timestamp: new Date(),
          price: currentPrice
        });
        
        // Keep only last 50 price points
        if (config.priceHistory.length > 50) {
          config.priceHistory = config.priceHistory.slice(-50);
        }
        
      } catch (error) {
        console.error(`Failed to check price for product ${baseProductId}:`, error);
      }
    }
  }
  
  startMonitoring(intervalMs = 300000) { // 5 minutes default
    this.interval = setInterval(() => {
      this.checkPrices();
    }, intervalMs);
    
    // Initial check
    this.checkPrices();
  }
  
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Usage
const monitor = new PriceMonitor(apiClient);
monitor.addProduct('uuid-product-1', 2000); // Alert if price drops below $2000
monitor.addProduct('uuid-product-2', 1500); // Alert if price drops below $1500
monitor.startMonitoring(600000); // Check every 10 minutes
```

## 🔗 Integration Guides

### **React/Next.js Integration**

```jsx
// React hook for product comparison
import { useState, useEffect, useCallback } from 'react';

const useProductComparison = (apiClient) => {
  const [searchResults, setSearchResults] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProducts = useCallback(async (query) => {
    if (query.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await apiClient.request(`/search?q=${encodeURIComponent(query)}`);
      setSearchResults(results.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const getComparison = useCallback(async (baseProductId) => {
    setLoading(true);
    setError(null);
    
    try {
      const comparison = await apiClient.request(`/${baseProductId}`);
      setComparison(comparison);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    searchResults,
    comparison,
    loading,
    error,
    searchProducts,
    getComparison
  };
};

// React component
const ProductComparisonWidget = () => {
  const [query, setQuery] = useState('');
  const { searchResults, comparison, loading, error, searchProducts, getComparison } = useProductComparison(apiClient);

  const handleSearch = (e) => {
    e.preventDefault();
    searchProducts(query);
  };

  const handleProductSelect = (product) => {
    getComparison(product.id);
  };

  return (
    <div className="product-comparison-widget">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading || query.length < 2}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          {searchResults.map(product => (
            <div
              key={product.id}
              className="product-item"
              onClick={() => handleProductSelect(product)}
            >
              <h4>{product.fullName}</h4>
              <p>{product.storeCount} stores • {product.totalVariants} variants</p>
            </div>
          ))}
        </div>
      )}

      {comparison && (
        <div className="price-comparison">
          <h3>{comparison.product.fullName}</h3>
          <div className="price-range">
            <span>${comparison.priceRange.min} - ${comparison.priceRange.max}</span>
            <span>Avg: ${comparison.priceRange.avg}</span>
          </div>
          <div className="stores">
            {comparison.stores
              .sort((a, b) => a.price - b.price)
              .map((storeData, index) => (
                <div key={storeData.store.id} className="store-item">
                  <div className="store-info">
                    <h4>{storeData.store.name}</h4>
                    {storeData.store.isVerified && <span className="verified">✅</span>}
                  </div>
                  <div className="price">${storeData.price}</div>
                  {index === 0 && <div className="best-price">Best Price!</div>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Vue.js Integration**

```javascript
// Vue 3 Composition API
import { ref, computed } from 'vue';

export function useProductComparison(apiClient) {
  const searchResults = ref([]);
  const comparison = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const searchProducts = async (query) => {
    if (query.length < 2) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const results = await apiClient.request(`/search?q=${encodeURIComponent(query)}`);
      searchResults.value = results.data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getComparison = async (baseProductId) => {
    loading.value = true;
    error.value = null;
    
    try {
      const comparisonData = await apiClient.request(`/${baseProductId}`);
      comparison.value = comparisonData;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const sortedStores = computed(() => {
    if (!comparison.value) return [];
    return [...comparison.value.stores].sort((a, b) => a.price - b.price);
  });

  return {
    searchResults,
    comparison,
    loading,
    error,
    searchProducts,
    getComparison,
    sortedStores
  };
}
```

### **Mobile App Integration**

```dart
// Flutter/Dart example
class ProductComparisonService {
  static const String baseUrl = 'http://localhost:3000/api/v1/product-comparison';
  
  Future<List<ProductSearchResult>> searchProducts(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/search?q=${Uri.encodeComponent(query)}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((json) => ProductSearchResult.fromJson(json))
          .toList();
    }
    throw Exception('Failed to search products');
  }
  
  Future<ProductComparison> getProductComparison(String baseProductId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$baseProductId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return ProductComparison.fromJson(data);
    }
    throw Exception('Failed to get product comparison');
  }
}
```

## 🎯 Best Practices

### **1. Search Optimization**

- **Use specific queries**: "nova papel 70m" is better than "papel"
- **Include brand names**: "samsung galaxy s24" is more specific than "galaxy s24"
- **Try variations**: If no results, try different word orders or synonyms

### **2. Error Handling**

```javascript
const safeSearch = async (query) => {
  try {
    const results = await apiClient.request(`/search?q=${encodeURIComponent(query)}`);
    return results;
  } catch (error) {
    if (error.message.includes('401')) {
      // Handle authentication error
      console.error('Authentication failed. Please login again.');
    } else if (error.message.includes('403')) {
      // Handle permission error
      console.error('Insufficient permissions.');
    } else if (error.message.includes('404')) {
      // Handle not found
      console.error('Product not found.');
    } else {
      // Handle other errors
      console.error('Search failed:', error.message);
    }
    return { data: [], total: 0, query };
  }
};
```

### **3. Performance Optimization**

- **Cache results**: Store search results and comparisons locally
- **Debounce search**: Wait for user to stop typing before searching
- **Limit results**: Only fetch essential data for initial display

```javascript
// Debounced search
const useDebouncedSearch = (query, delay = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return debouncedQuery;
};
```

### **4. User Experience**

- **Show loading states**: Indicate when searches are in progress
- **Provide feedback**: Show error messages and success confirmations
- **Sort results**: Always sort stores by price for easy comparison
- **Highlight best deals**: Make the best price stand out visually

## 🚨 Troubleshooting

### **Common Issues**

#### **1. No Search Results**

**Problem**: Search returns empty results
**Solutions**:
- Check if query is at least 2 characters long
- Try different search terms or variations
- Verify the product exists in the database
- Check if the product has been scraped recently

#### **2. Authentication Errors**

**Problem**: Getting 401 Unauthorized errors
**Solutions**:
- Verify JWT token is valid and not expired
- Check if token is properly included in Authorization header
- Re-login to get a fresh token

#### **3. Permission Errors**

**Problem**: Getting 403 Forbidden errors
**Solutions**:
- Verify user has required role (`SUPER_ADMIN`, `ADMIN`, or `STORE_ADMIN`)
- Check if user account is active
- Contact administrator for role assignment

#### **4. Product Not Found**

**Problem**: Getting 404 Not Found for product comparison
**Solutions**:
- Verify the base product ID is correct
- Check if the product exists in the database
- Ensure the product has been matched to stores

#### **5. Slow Response Times**

**Problem**: API responses are slow
**Solutions**:
- Check network connection
- Verify server is running properly
- Consider implementing caching
- Contact support if issue persists

### **Debugging Tips**

1. **Check API Response**: Always log the full API response to understand the data structure
2. **Validate Input**: Ensure search queries and product IDs are properly formatted
3. **Test with Known Data**: Use products you know exist to test the API
4. **Monitor Network**: Use browser dev tools to check network requests and responses

### **Getting Help**

If you encounter issues not covered in this guide:

1. **Check the API Documentation**: See `PRODUCT_COMPARISON_API_ENDPOINTS.md`
2. **Review Examples**: Check `PRODUCT_COMPARISON_API_EXAMPLES.md`
3. **Test with Postman**: Use the provided Postman collection
4. **Contact Support**: Reach out to the development team

## 📚 Related Documentation

- [Product Comparison API Endpoints](./api/PRODUCT_COMPARISON_API_ENDPOINTS.md) - Complete API reference
- [Product Comparison API Examples](./api/PRODUCT_COMPARISON_API_EXAMPLES.md) - Practical implementation examples
- [Store Products Module](./modules/store-products.md) - Store product management
- [Scraping Module](./modules/scraping.md) - Automated price updates
- [Authentication Guide](./user-guides/authentication-guide.md) - JWT authentication setup

---

*This document provides comprehensive user guidance for the Product Comparison module. For technical implementation details, see the API documentation and examples.*

