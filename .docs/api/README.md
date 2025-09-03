# 📚 Pritzio Backend API Documentation

## 📋 Overview

This directory contains comprehensive documentation for the Pritzio Backend APIs, designed to help frontend developers integrate with all available modules including Products, Store Products, and Scraping functionality.

## 📁 Documentation Structure

### **Core Documentation**
- **[PRODUCTS_API_ENDPOINTS.md](./PRODUCTS_API_ENDPOINTS.md)** - Complete API reference with all endpoints, request/response formats, and examples
- **[PRODUCTS_API_EXAMPLES.md](./PRODUCTS_API_EXAMPLES.md)** - Practical examples and use cases for frontend implementation
- **[PRODUCTS_API_POSTMAN_COLLECTION.json](./PRODUCTS_API_POSTMAN_COLLECTION.json)** - Postman collection for testing all endpoints

### **Store Products Module Documentation**
- **[STORE_PRODUCTS_API_ENDPOINTS.md](./STORE_PRODUCTS_API_ENDPOINTS.md)** - Complete store products API reference with all endpoints
- **[STORE_PRODUCTS_API_EXAMPLES.md](./STORE_PRODUCTS_API_EXAMPLES.md)** - Practical store products examples and price comparison workflows
- **[STORE_PRODUCTS_API_POSTMAN_COLLECTION.json](./STORE_PRODUCTS_API_POSTMAN_COLLECTION.json)** - Postman collection for testing store products endpoints

### **Scraping Module Documentation**
- **[SCRAPING_API_ENDPOINTS.md](./SCRAPING_API_ENDPOINTS.md)** - Complete scraping API reference with all endpoints
- **[SCRAPING_API_EXAMPLES.md](./SCRAPING_API_EXAMPLES.md)** - Practical scraping examples and automation workflows
- **[SCRAPING_API_POSTMAN_COLLECTION.json](./SCRAPING_API_POSTMAN_COLLECTION.json)** - Postman collection for testing scraping endpoints

## 🚀 Quick Start

### **1. Authentication**
All API endpoints require JWT authentication:
```bash
Authorization: Bearer <your-jwt-token>
```

### **2. Base URLs**
```
Products API: http://localhost:3000/api/v1/products
Store Products API: http://localhost:3000/api/v1/store-products
Scraping API: http://localhost:3000/api/v1/scraping
```

### **3. Response Format**
All responses follow this standard format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎯 Key Features

### **⭐ New Features (v1.0)**
- **Bulk Product Creation**: Create up to 100 products in a single request
- **Price Comparison**: Compare prices across multiple stores
- **Scraping Integration**: Endpoints for automated scraping workflows
- **Advanced Filtering**: Comprehensive filtering and search capabilities
- **Bulk Operations**: Mass operations for product management
- **Web Scraping**: Automated web scraping with browser automation
- **Price Monitoring**: Automated price monitoring across multiple sites

### **Products Module**
- ✅ Create, read, update, delete products
- ✅ Advanced filtering and pagination
- ✅ Product analytics and statistics
- ✅ Role-based access control
- ✅ Comprehensive validation

### **Store Products Module**
- ✅ Store-product relationship management
- ✅ Price comparison across stores
- ✅ Inventory tracking and availability
- ✅ Automated scraping for price updates
- ✅ Bulk operations for store products
- ✅ Analytics and reporting

### **Scraping Module**
- ✅ Web scraping with Playwright/Chromium
- ✅ User agent rotation and anti-detection
- ✅ Intelligent selector detection
- ✅ Timeout management and error handling
- ✅ Integration with Products and Store Products APIs
- ✅ Health monitoring and status checks

## 📖 Documentation Usage

### **For Frontend Developers**
1. **Start with**: [PRODUCTS_API_ENDPOINTS.md](./PRODUCTS_API_ENDPOINTS.md) for complete API reference
2. **Then check**: [PRODUCTS_API_EXAMPLES.md](./PRODUCTS_API_EXAMPLES.md) for practical implementation examples
3. **Test with**: Import the Postman collection for hands-on testing

### **For Store Products Integration**
1. **Start with**: [STORE_PRODUCTS_API_ENDPOINTS.md](./STORE_PRODUCTS_API_ENDPOINTS.md) for store products API reference
2. **Then check**: [STORE_PRODUCTS_API_EXAMPLES.md](./STORE_PRODUCTS_API_EXAMPLES.md) for price comparison workflows
3. **Test with**: Import the store products Postman collection for testing

### **For Scraping Integration**
1. **Start with**: [SCRAPING_API_ENDPOINTS.md](./SCRAPING_API_ENDPOINTS.md) for scraping API reference
2. **Then check**: [SCRAPING_API_EXAMPLES.md](./SCRAPING_API_EXAMPLES.md) for automation workflows
3. **Test with**: Import the scraping Postman collection for testing

### **For API Testing**
1. Import the relevant Postman collection (Products, Store Products, or Scraping)
2. Set your JWT token in the collection variables
3. Update the base URL if needed
4. Start testing endpoints

## 🔧 Common Use Cases

### **1. Product Catalog**
```javascript
// Get products for catalog display
const products = await fetch('/api/v1/products?page=1&limit=20&status=active');
```

### **2. Bulk Import (Scraping)**
```javascript
// Import multiple products from scraping
const result = await fetch('/api/v1/products/bulk/create', {
  method: 'POST',
  body: JSON.stringify({
    products: scrapedProducts,
    options: { skipDuplicates: true }
  })
});
```

### **3. Price Comparison**
```javascript
// Compare prices across stores
const priceComparison = await fetch('/api/v1/store-products/price-comparison/product-id?currency=USD');
const bestPrice = priceComparison.bestPrice;
```

### **4. Store Product Management**
```javascript
// Admin operations
const analytics = await fetch('/api/v1/store-products/analytics');
const bulkUpdate = await fetch('/api/v1/store-products/bulk/activate', {
  method: 'POST',
  body: JSON.stringify({ storeProductIds: ['id1', 'id2'] })
});
```

### **5. Product Management**
```javascript
// Admin operations
const analytics = await fetch('/api/v1/products/analytics');
const bulkUpdate = await fetch('/api/v1/products/bulk/activate', {
  method: 'POST',
  body: JSON.stringify({ productIds: ['id1', 'id2'] })
});
```

### **6. Web Scraping**
```javascript
// Scrape website content
const scrapingResult = await fetch('/api/v1/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=30000');
const healthCheck = await fetch('/api/v1/scraping/health');
```

### **7. Automated Scraping Workflow**
```javascript
// Complete scraping workflow
const scrapeAndCreateProducts = async (url) => {
  // 1. Scrape the URL
  const scrapingResult = await scrapeUrl(url);
  
  // 2. Parse products from HTML
  const products = parseProducts(scrapingResult.html);
  
  // 3. Create products in bulk
  const bulkResult = await bulkCreateProducts(products);
  
  return { scraping: scrapingResult, products: bulkResult };
};
```

## 🔒 Permissions

### **Public Endpoints**
- `GET /products` - List products (with filters)
- `GET /products/{id}` - Get product by ID
- `GET /products/code/{code}` - Get product by code

### **Admin Endpoints** (Require SUPER_ADMIN, ADMIN, or STORE_ADMIN)
- `POST /products` - Create product
- `POST /products/bulk/create` - Bulk create products
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `POST /products/bulk/*` - Bulk operations
- `GET /products/scraping/*` - Scraping endpoints
- `GET /products/analytics` - Analytics

### **Store Products Endpoints**
- `GET /store-products` - List store products (all users)
- `GET /store-products/price-comparison/{productId}` - Price comparison (all users)
- `POST /store-products` - Create store product (admin)
- `PUT /store-products/{id}` - Update store product (admin)
- `DELETE /store-products/{id}` - Delete store product (admin)
- `GET /store-products/analytics` - Analytics (admin)

### **Scraping Endpoints** (Require SUPER_ADMIN, ADMIN, or STORE_ADMIN)
- `GET /scraping/scrape` - Scrape URL content
- `GET /scraping/health` - Check scraping service health

## 📊 Data Types

### **Product Types**
- `physical` - Physical products
- `digital` - Digital products  
- `service` - Services
- `subscription` - Subscription-based products

### **Product Status**
- `active` - Product is active and available
- `inactive` - Product is temporarily inactive
- `discontinued` - Product is discontinued
- `out_of_stock` - Product is out of stock
- `coming_soon` - Product is coming soon

### **Product Condition**
- `new` - Brand new product
- `used` - Used product
- `refurbished` - Refurbished product
- `open_box` - Open box product

### **Store Product Status**
- `active` - Product is active in store
- `inactive` - Product is inactive in store
- `out_of_stock` - Product is out of stock
- `discontinued` - Product is discontinued
- `coming_soon` - Product is coming soon
- `error` - Error in scraping/updating

### **Availability**
- `in_stock` - Product is in stock
- `low_stock` - Product has low stock
- `out_of_stock` - Product is out of stock
- `pre_order` - Product available for pre-order
- `backorder` - Product on backorder

## 🚨 Error Handling

### **Common Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (product doesn't exist)
- `409` - Conflict (duplicate product code)

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [/* validation details */]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Testing

### **Postman Collection**
The included Postman collection provides:
- ✅ All endpoints pre-configured
- ✅ Sample request bodies
- ✅ Environment variables
- ✅ Test scripts for validation
- ✅ Auto-generated product IDs

### **Manual Testing**
```bash
# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/products

# Test product creation
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Product","code":"TEST-001","category":"Electronics","type":"physical","status":"active","condition":"new"}' \
     http://localhost:3000/api/v1/products
```

## 📱 Frontend Integration

### **React Example**
```jsx
import { useState, useEffect } from 'react';

const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/v1/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setProducts(data.data.products);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [JSON.stringify(filters)]);
  return { products, loading, refetch: fetchProducts };
};
```

### **Vue.js Example**
```javascript
// Vue 3 Composition API
import { ref, onMounted } from 'vue';

export function useProducts(filters = {}) {
  const products = ref([]);
  const loading = ref(false);

  const fetchProducts = async () => {
    loading.value = true;
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/v1/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) products.value = data.data.products;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchProducts);
  return { products, loading, fetchProducts };
}
```

## 🔄 Version History

### **v1.0.0** (2024-01-15)
- ✅ Initial API release
- ✅ Products module with bulk operations
- ✅ Store Products module with price comparison
- ✅ Scraping integration endpoints
- ✅ Advanced filtering and search
- ✅ Comprehensive documentation

## 🆘 Support

### **Getting Help**
1. **Check the documentation** - Most questions are answered in the detailed docs
2. **Test with Postman** - Use the collection to verify API behavior
3. **Check error responses** - API provides detailed error information
4. **Contact the backend team** - For technical issues

### **Common Issues**
- **401 Unauthorized**: Check your JWT token
- **403 Forbidden**: Verify your user role has required permissions
- **400 Bad Request**: Check request body format and validation rules
- **404 Not Found**: Verify the product ID/code exists

## 📚 Additional Resources

- **Swagger Documentation**: Available at `http://localhost:3000/api/docs` when running the application
- **Technical Documentation**: See `.dev/technical/PRODUCTS_MODULE_ENHANCEMENTS.md`
- **Backend Architecture**: See `.dev/architecture/overview.md`

---

*Last updated: 2024-01-15*  
*API Version: 1.0*  
*Documentation Version: 1.0*
