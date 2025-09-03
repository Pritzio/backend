# 🕷️ Scraping API - Endpoints Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Scraping module, including all endpoints, request/response formats, and practical examples for automated web scraping operations.

## 🔐 Authentication

All endpoints require authentication using JWT Bearer tokens:

```bash
Authorization: Bearer <your-jwt-token>
```

## 🏷️ Base URL

```
http://localhost:3000/api/v1/scraping
```

## 📊 Response Format

All responses follow this standard format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Endpoints

### 1. **Scrape URL**

**Endpoint**: `GET /api/v1/scraping/scrape`

**Description**: Scrape HTML content from a given URL using headless browser automation.

**Permissions**: `SUPER_ADMIN`, `ADMIN`, `STORE_ADMIN`

**Query Parameters**:
- `url` (string, required): URL to scrape
- `timeout` (number, optional): Timeout in milliseconds (5000-120000, default: 30000)
- `waitForSelector` (string, optional): CSS selector to wait for before scraping
- `userAgent` (string, optional): Custom user agent string

**Example Request**:
```bash
GET /api/v1/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=30000&waitForSelector=[data-cnstrc-item-id]
```

**Response** (200 OK):
```json
{
  "success": true,
  "url": "https://jumbo.cl/marcas-exclusivas",
  "html": "<html><head><title>Jumbo - Marcas Exclusivas</title></head><body>...</body></html>",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "executionTime": 2500
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "url": "https://jumbo.cl/marcas-exclusivas",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "executionTime": 5000,
  "error": "Timeout waiting for content to load"
}
```

### 2. **Health Check**

**Endpoint**: `GET /api/v1/scraping/health`

**Description**: Check the health status of the scraping service.

**Permissions**: All authenticated users

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "scraping",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "browser": {
      "available": true,
      "type": "chromium",
      "version": "136.0.0.0"
    }
  },
  "message": "Scraping service is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuration Options

### **Scraping Options**

#### **Timeout Configuration**
- **Default**: 30000ms (30 seconds)
- **Range**: 5000ms - 120000ms (5 seconds - 2 minutes)
- **Purpose**: Maximum time to wait for page content to load

#### **Wait Selectors**
The service uses intelligent selector detection with fallback options:

**Primary Selectors**:
- `[data-cnstrc-item-id]` - Product grid items (default)
- `.product-item` - Generic product items
- `.product-card` - Product cards
- `.product-grid` - Product grid
- `.product-list` - Product list

**Fallback Selectors**:
- `.product` - Generic product
- `.item` - Generic items
- `.card` - Generic cards
- `main` - Main content
- `body` - Fallback to body

#### **User Agent Rotation**
The service automatically rotates between multiple user agents to avoid detection:

```javascript
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
];
```

#### **Browser Configuration**
The service uses Chromium with optimized settings for scraping:

```javascript
const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-blink-features=AutomationControlled',
  '--disable-extensions',
  '--disable-plugins',
  '--disable-images',
  '--disable-javascript',
  '--disable-web-security',
  '--allow-running-insecure-content'
];
```

## 🔒 Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "url": "invalid-url",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "executionTime": 100,
  "error": "URL must be a valid URL"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "executionTime": 30000,
  "error": "Timeout waiting for content to load"
}
```

## 🚀 Frontend Implementation Examples

### **JavaScript/TypeScript Examples**

#### **Basic Scraping**
```javascript
const scrapeUrl = async (url, options = {}) => {
  const params = new URLSearchParams({
    url,
    ...options
  });
  
  const response = await fetch(`/api/v1/scraping/scrape?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usage
const result = await scrapeUrl('https://jumbo.cl/marcas-exclusivas', {
  timeout: 30000,
  waitForSelector: '[data-cnstrc-item-id]'
});
```

#### **Advanced Scraping with Error Handling**
```javascript
const scrapeWithRetry = async (url, options = {}, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeUrl(url, options);
      
      if (result.success) {
        return result;
      }
      
      // If it's a timeout error, try with longer timeout
      if (result.error && result.error.includes('timeout')) {
        options.timeout = (options.timeout || 30000) * 1.5;
        continue;
      }
      
      throw new Error(result.error);
      
    } catch (error) {
      console.error(`Scraping attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

#### **Batch Scraping**
```javascript
const scrapeMultipleUrls = async (urls, options = {}) => {
  const results = [];
  
  // Process URLs in parallel (limit to 5 concurrent requests)
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const result = await scrapeUrl(url, options);
        return { url, success: true, data: result };
      } catch (error) {
        return { url, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the service
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};
```

### **React Hook Example**
```javascript
import { useState, useCallback } from 'react';

const useScraping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scrapeUrl = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        url,
        ...options
      });
      
      const response = await fetch(`/api/v1/scraping/scrape?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/scraping/health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      throw new Error('Health check failed');
    }
  }, []);

  return {
    scrapeUrl,
    checkHealth,
    loading,
    error
  };
};
```

### **Vue.js Example**
```javascript
// Vue 3 Composition API
import { ref } from 'vue';

export function useScraping() {
  const loading = ref(false);
  const error = ref(null);

  const scrapeUrl = async (url, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        url,
        ...options
      });
      
      const response = await fetch(`/api/v1/scraping/scrape?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/v1/scraping/health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      throw new Error('Health check failed');
    }
  };

  return {
    scrapeUrl,
    checkHealth,
    loading,
    error
  };
}
```

## 🔧 Integration with Products API

### **Complete Scraping Workflow**

```javascript
const completeScrapingWorkflow = async (targetUrl) => {
  try {
    // 1. Check scraping service health
    const health = await checkScrapingHealth();
    if (!health.success) {
      throw new Error('Scraping service is not available');
    }

    // 2. Scrape the URL
    const scrapingResult = await scrapeUrl(targetUrl, {
      timeout: 45000,
      waitForSelector: '[data-cnstrc-item-id]'
    });

    if (!scrapingResult.success) {
      throw new Error(`Scraping failed: ${scrapingResult.error}`);
    }

    // 3. Parse the HTML to extract product data
    const products = parseProductData(scrapingResult.html);

    // 4. Get products ready for scraping from Products API
    const productsForScraping = await getProductsForScraping({
      limit: 100,
      priority: 'high'
    });

    // 5. Create products in bulk
    if (products.length > 0) {
      const bulkResult = await bulkCreateProducts(products, {
        skipDuplicates: true
      });

      // 6. Update scraping metadata for each product
      for (const product of bulkResult.data.results) {
        if (product.success) {
          await updateScrapingMetadata(product.product.id, {
            lastScraped: new Date().toISOString(),
            scrapingSource: 'automated_scraper',
            scrapingStatus: 'completed',
            scrapingMetadata: {
              sourceUrl: targetUrl,
              scrapedAt: new Date().toISOString()
            }
          });
        }
      }

      return {
        success: true,
        scraped: scrapingResult,
        productsCreated: bulkResult.data.created,
        productsFailed: bulkResult.data.failed
      };
    }

    return {
      success: true,
      scraped: scrapingResult,
      productsCreated: 0,
      message: 'No products found in scraped content'
    };

  } catch (error) {
    console.error('Scraping workflow failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to parse product data from HTML
const parseProductData = (html) => {
  // This would contain your HTML parsing logic
  // Example implementation:
  const products = [];
  
  // Parse HTML and extract product information
  // This is a simplified example - you'd implement actual parsing logic
  
  return products.map(item => ({
    name: item.name,
    code: generateProductCode(item.name),
    category: item.category || 'Electronics',
    subcategory: item.subcategory || 'General',
    brand: item.brand,
    type: 'physical',
    status: 'active',
    condition: 'new',
    description: item.description,
    specifications: item.specifications,
    features: item.features,
    tags: item.tags,
    metadata: {
      scrapingSource: 'automated_scraper',
      scrapingPriority: 'medium'
    }
  }));
};
```

## 🧪 Testing

### **Postman Collection**
```json
{
  "info": {
    "name": "Scraping API",
    "description": "Test scraping endpoints"
  },
  "item": [
    {
      "name": "Scrape URL",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=30000"
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/scraping/health"
      }
    }
  ]
}
```

### **cURL Examples**

#### **Basic Scraping**
```bash
curl -X GET "http://localhost:3000/api/v1/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=30000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Advanced Scraping with Custom Options**
```bash
curl -X GET "http://localhost:3000/api/v1/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=45000&waitForSelector=[data-cnstrc-item-id]&userAgent=Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit/537.36" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Health Check**
```bash
curl -X GET "http://localhost:3000/api/v1/scraping/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Performance Considerations

### **Timeout Guidelines**
- **Fast sites**: 15000-20000ms
- **Medium sites**: 30000-45000ms (default)
- **Slow sites**: 60000-90000ms
- **Maximum**: 120000ms

### **Concurrent Requests**
- **Recommended**: Maximum 5 concurrent scraping requests
- **Rate limiting**: Add delays between requests (1-2 seconds)
- **Batch processing**: Process URLs in batches of 5-10

### **Resource Management**
- **Memory**: Each browser instance uses ~50-100MB
- **CPU**: Scraping is CPU-intensive, monitor usage
- **Network**: Consider bandwidth limitations

## 🔒 Security Considerations

### **URL Validation**
- Only HTTPS URLs are recommended
- Validate URLs before scraping
- Avoid scraping sensitive or private content

### **Rate Limiting**
- Implement delays between requests
- Respect robots.txt files
- Monitor for blocking or CAPTCHAs

### **Error Handling**
- Always handle timeouts gracefully
- Implement retry logic with exponential backoff
- Log errors for monitoring

## 📚 Additional Resources

- **Products API Integration**: See `PRODUCTS_API_ENDPOINTS.md`
- **Technical Documentation**: See `.dev/technical/SCRAPING_MODULE_IMPLEMENTATION.md`
- **Swagger Documentation**: Available at `http://localhost:3000/api/docs`

---

*Last updated: 2024-01-15*
*API Version: 1.0*
