# 🕷️ Scraping API - Practical Examples

## 📋 Overview

This document provides practical examples and use cases for the Scraping API, showing real-world scenarios for automated web scraping operations.

## 🎯 Common Use Cases

### 1. **E-commerce Product Scraping**

#### **Scenario**: Scrape product information from e-commerce websites

```javascript
// Scrape product catalog from e-commerce site
const scrapeEcommerceProducts = async (catalogUrl) => {
  try {
    // Scrape the catalog page
    const result = await scrapeUrl(catalogUrl, {
      timeout: 45000,
      waitForSelector: '[data-cnstrc-item-id]' // Product grid selector
    });

    if (!result.success) {
      throw new Error(`Scraping failed: ${result.error}`);
    }

    // Parse products from HTML
    const products = parseEcommerceProducts(result.html);
    
    return {
      success: true,
      products,
      totalFound: products.length,
      sourceUrl: catalogUrl
    };

  } catch (error) {
    console.error('E-commerce scraping failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Parse product data from e-commerce HTML
const parseEcommerceProducts = (html) => {
  const products = [];
  
  // This is a simplified example - you'd implement actual HTML parsing
  // using libraries like Cheerio, JSDOM, or custom regex patterns
  
  // Example parsing logic for Jumbo.cl structure:
  const productElements = html.match(/data-cnstrc-item-id="[^"]+"/g) || [];
  
  productElements.forEach((element, index) => {
    const productId = element.match(/data-cnstrc-item-id="([^"]+)"/)[1];
    
    // Extract product information (this would be more sophisticated in reality)
    products.push({
      name: `Product ${index + 1}`,
      code: `JUMBO-${productId}`,
      category: 'Groceries',
      subcategory: 'General',
      brand: 'Jumbo',
      type: 'physical',
      status: 'active',
      condition: 'new',
      description: `Product scraped from Jumbo catalog`,
      metadata: {
        scrapingSource: 'jumbo.cl',
        scrapingPriority: 'high',
        originalId: productId
      }
    });
  });
  
  return products;
};
```

#### **React Component for E-commerce Scraping**
```jsx
import React, { useState } from 'react';
import { useScraping } from '../hooks/useScraping';

const EcommerceScrapingTool = () => {
  const { scrapeUrl, loading, error } = useScraping();
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);

  const handleScrape = async () => {
    if (!url) return;

    try {
      const result = await scrapeUrl(url, {
        timeout: 45000,
        waitForSelector: '[data-cnstrc-item-id]'
      });

      if (result.success) {
        const products = parseEcommerceProducts(result.html);
        setResults({
          success: true,
          products,
          totalFound: products.length,
          executionTime: result.executionTime
        });
      } else {
        setResults({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    }
  };

  return (
    <div className="scraping-tool">
      <h2>E-commerce Product Scraping</h2>
      
      <div className="input-section">
        <input
          type="url"
          placeholder="Enter catalog URL (e.g., https://jumbo.cl/marcas-exclusivas)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <button 
          onClick={handleScrape} 
          disabled={loading || !url}
        >
          {loading ? 'Scraping...' : 'Scrape Products'}
        </button>
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="results">
          {results.success ? (
            <div>
              <h3>Scraping Results</h3>
              <p>Found {results.totalFound} products</p>
              <p>Execution time: {results.executionTime}ms</p>
              
              <div className="products-preview">
                {results.products.slice(0, 5).map((product, index) => (
                  <div key={index} className="product-item">
                    <h4>{product.name}</h4>
                    <p>Code: {product.code}</p>
                    <p>Category: {product.category}</p>
                  </div>
                ))}
                {results.products.length > 5 && (
                  <p>... and {results.products.length - 5} more products</p>
                )}
              </div>
            </div>
          ) : (
            <div className="error">
              Scraping failed: {results.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 2. **Automated Price Monitoring**

#### **Scenario**: Monitor prices across multiple e-commerce sites

```javascript
// Price monitoring system
class PriceMonitor {
  constructor() {
    this.targetSites = [
      {
        name: 'Jumbo',
        url: 'https://jumbo.cl/marcas-exclusivas',
        selector: '[data-cnstrc-item-id]',
        parser: this.parseJumboProducts
      },
      {
        name: 'Lider',
        url: 'https://lider.cl/catalogo',
        selector: '.product-item',
        parser: this.parseLiderProducts
      }
      // Add more sites as needed
    ];
  }

  async monitorAllSites() {
    const results = [];
    
    for (const site of this.targetSites) {
      try {
        console.log(`Monitoring ${site.name}...`);
        
        const result = await scrapeUrl(site.url, {
          timeout: 60000,
          waitForSelector: site.selector
        });

        if (result.success) {
          const products = site.parser(result.html);
          results.push({
            site: site.name,
            success: true,
            products,
            timestamp: new Date()
          });
        } else {
          results.push({
            site: site.name,
            success: false,
            error: result.error,
            timestamp: new Date()
          });
        }

        // Delay between sites to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.push({
          site: site.name,
          success: false,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  parseJumboProducts(html) {
    // Jumbo-specific parsing logic
    const products = [];
    // Implementation would extract product names, prices, etc.
    return products;
  }

  parseLiderProducts(html) {
    // Lider-specific parsing logic
    const products = [];
    // Implementation would extract product names, prices, etc.
    return products;
  }

  async savePriceData(monitoringResults) {
    // Save price data to database or send to Products API
    for (const result of monitoringResults) {
      if (result.success && result.products.length > 0) {
        // Update products with new price information
        for (const product of result.products) {
          await updateScrapingMetadata(product.id, {
            lastScraped: new Date().toISOString(),
            scrapingSource: result.site.toLowerCase(),
            scrapingStatus: 'completed',
            scrapingMetadata: {
              price: product.price,
              availability: product.availability,
              lastPriceUpdate: new Date().toISOString()
            }
          });
        }
      }
    }
  }
}

// Usage
const priceMonitor = new PriceMonitor();

const runPriceMonitoring = async () => {
  console.log('Starting price monitoring...');
  
  const results = await priceMonitor.monitorAllSites();
  
  // Save results
  await priceMonitor.savePriceData(results);
  
  // Log summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Price monitoring completed:`);
  console.log(`- Successful: ${successful.length} sites`);
  console.log(`- Failed: ${failed.length} sites`);
  
  if (failed.length > 0) {
    console.log('Failed sites:', failed.map(f => f.site));
  }
};
```

### 3. **Batch Scraping with Progress Tracking**

#### **Scenario**: Scrape multiple URLs with progress tracking and error handling

```javascript
// Batch scraping with progress tracking
class BatchScraper {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 5;
    this.delayBetweenBatches = options.delayBetweenBatches || 2000;
    this.maxRetries = options.maxRetries || 3;
    this.onProgress = options.onProgress || (() => {});
  }

  async scrapeBatch(urls, options = {}) {
    const results = [];
    const total = urls.length;
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += this.batchSize) {
      const batch = urls.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(urls.length / this.batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} URLs)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (url, index) => {
        const globalIndex = i + index;
        
        try {
          const result = await this.scrapeWithRetry(url, options);
          
          this.onProgress({
            current: globalIndex + 1,
            total,
            percentage: Math.round(((globalIndex + 1) / total) * 100),
            currentUrl: url,
            success: true,
            result
          });
          
          return {
            url,
            success: true,
            data: result,
            index: globalIndex
          };
          
        } catch (error) {
          this.onProgress({
            current: globalIndex + 1,
            total,
            percentage: Math.round(((globalIndex + 1) / total) * 100),
            currentUrl: url,
            success: false,
            error: error.message
          });
          
          return {
            url,
            success: false,
            error: error.message,
            index: globalIndex
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches
      if (i + this.batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }
    
    return {
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        successRate: Math.round((results.filter(r => r.success).length / results.length) * 100)
      }
    };
  }

  async scrapeWithRetry(url, options = {}, attempt = 1) {
    try {
      const result = await scrapeUrl(url, options);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.log(`Retry ${attempt}/${this.maxRetries} for ${url}`);
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.scrapeWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }
}

// Usage with progress tracking
const batchScraper = new BatchScraper({
  batchSize: 3,
  delayBetweenBatches: 2000,
  maxRetries: 2,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
    console.log(`Current: ${progress.currentUrl}`);
    
    if (progress.success) {
      console.log(`✅ Success: ${progress.result.executionTime}ms`);
    } else {
      console.log(`❌ Failed: ${progress.error}`);
    }
  }
});

const urls = [
  'https://jumbo.cl/marcas-exclusivas',
  'https://lider.cl/catalogo',
  'https://santaisabel.cl/productos',
  // Add more URLs
];

const runBatchScraping = async () => {
  try {
    const results = await batchScraper.scrapeBatch(urls, {
      timeout: 45000,
      waitForSelector: '[data-cnstrc-item-id]'
    });
    
    console.log('Batch scraping completed:');
    console.log(`- Total: ${results.summary.total}`);
    console.log(`- Successful: ${results.summary.successful}`);
    console.log(`- Failed: ${results.summary.failed}`);
    console.log(`- Success rate: ${results.summary.successRate}%`);
    
    return results;
    
  } catch (error) {
    console.error('Batch scraping failed:', error);
    throw error;
  }
};
```

### 4. **Scheduled Scraping with Cron Jobs**

#### **Scenario**: Automated scraping on a schedule

```javascript
// Scheduled scraping system
class ScheduledScraper {
  constructor() {
    this.schedules = new Map();
    this.isRunning = false;
  }

  addSchedule(name, cronExpression, urls, options = {}) {
    this.schedules.set(name, {
      cronExpression,
      urls,
      options,
      lastRun: null,
      nextRun: this.calculateNextRun(cronExpression),
      enabled: true
    });
  }

  start() {
    if (this.isRunning) {
      console.log('Scheduled scraper is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduled scraper...');

    // Check for due schedules every minute
    this.interval = setInterval(() => {
      this.checkSchedules();
    }, 60000);

    console.log('Scheduled scraper started');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Scheduled scraper is not running');
      return;
    }

    this.isRunning = false;
    clearInterval(this.interval);
    console.log('Scheduled scraper stopped');
  }

  checkSchedules() {
    const now = new Date();
    
    for (const [name, schedule] of this.schedules) {
      if (!schedule.enabled) continue;
      
      if (now >= schedule.nextRun) {
        console.log(`Running scheduled scraping: ${name}`);
        this.runSchedule(name, schedule);
        
        // Update next run time
        schedule.lastRun = now;
        schedule.nextRun = this.calculateNextRun(schedule.cronExpression);
      }
    }
  }

  async runSchedule(name, schedule) {
    try {
      console.log(`Starting scheduled scraping: ${name}`);
      console.log(`URLs: ${schedule.urls.length}`);
      
      const batchScraper = new BatchScraper({
        batchSize: 3,
        delayBetweenBatches: 2000,
        onProgress: (progress) => {
          console.log(`${name}: ${progress.percentage}% complete`);
        }
      });
      
      const results = await batchScraper.scrapeBatch(schedule.urls, schedule.options);
      
      console.log(`Scheduled scraping completed: ${name}`);
      console.log(`- Successful: ${results.summary.successful}`);
      console.log(`- Failed: ${results.summary.failed}`);
      
      // Save results or send notifications
      await this.handleScheduleResults(name, results);
      
    } catch (error) {
      console.error(`Scheduled scraping failed: ${name}`, error);
      
      // Send error notification
      await this.handleScheduleError(name, error);
    }
  }

  async handleScheduleResults(name, results) {
    // Save results to database
    // Send success notification
    // Update monitoring dashboards
    console.log(`Handling results for ${name}:`, results.summary);
  }

  async handleScheduleError(name, error) {
    // Log error
    // Send error notification
    // Update error tracking
    console.error(`Error in schedule ${name}:`, error.message);
  }

  calculateNextRun(cronExpression) {
    // Simplified cron calculation - in production, use a proper cron library
    // This is just an example for hourly runs
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    return nextHour;
  }
}

// Usage
const scheduledScraper = new ScheduledScraper();

// Add daily scraping at 2 AM
scheduledScraper.addSchedule('daily-products', '0 2 * * *', [
  'https://jumbo.cl/marcas-exclusivas',
  'https://lider.cl/catalogo'
], {
  timeout: 60000,
  waitForSelector: '[data-cnstrc-item-id]'
});

// Add hourly price monitoring
scheduledScraper.addSchedule('hourly-prices', '0 * * * *', [
  'https://jumbo.cl/ofertas',
  'https://lider.cl/ofertas'
], {
  timeout: 30000,
  waitForSelector: '.product-item'
});

// Start the scheduler
scheduledScraper.start();
```

### 5. **Error Handling and Monitoring**

#### **Scenario**: Robust error handling and monitoring system

```javascript
// Error handling and monitoring
class ScrapingMonitor {
  constructor() {
    this.errors = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastError: null
    };
  }

  async scrapeWithMonitoring(url, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await scrapeUrl(url, options);
      const responseTime = Date.now() - startTime;

      if (result.success) {
        this.metrics.successfulRequests++;
        this.updateAverageResponseTime(responseTime);
        
        return {
          success: true,
          data: result,
          metrics: {
            responseTime,
            timestamp: new Date()
          }
        };
      } else {
        this.metrics.failedRequests++;
        this.recordError(url, result.error, responseTime);
        
        return {
          success: false,
          error: result.error,
          metrics: {
            responseTime,
            timestamp: new Date()
          }
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.recordError(url, error.message, responseTime);
      
      return {
        success: false,
        error: error.message,
        metrics: {
          responseTime,
          timestamp: new Date()
        }
      };
    }
  }

  recordError(url, error, responseTime) {
    const errorRecord = {
      url,
      error,
      responseTime,
      timestamp: new Date(),
      type: this.categorizeError(error)
    };

    this.errors.push(errorRecord);
    this.metrics.lastError = errorRecord;

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Log error
    console.error(`Scraping error for ${url}:`, error);
  }

  categorizeError(error) {
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('404')) return 'not_found';
    if (error.includes('403')) return 'forbidden';
    if (error.includes('500')) return 'server_error';
    if (error.includes('network')) return 'network';
    return 'unknown';
  }

  updateAverageResponseTime(responseTime) {
    const total = this.metrics.successfulRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100)
        : 0,
      recentErrors: this.errors.slice(-10)
    };
  }

  getErrorSummary() {
    const errorTypes = {};
    this.errors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorTypes,
      lastError: this.metrics.lastError
    };
  }
}

// Usage
const monitor = new ScrapingMonitor();

const scrapeWithMonitoring = async (urls) => {
  const results = [];
  
  for (const url of urls) {
    const result = await monitor.scrapeWithMonitoring(url, {
      timeout: 30000,
      waitForSelector: '[data-cnstrc-item-id]'
    });
    
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Log metrics
  const metrics = monitor.getMetrics();
  const errorSummary = monitor.getErrorSummary();
  
  console.log('Scraping Metrics:');
  console.log(`- Total requests: ${metrics.totalRequests}`);
  console.log(`- Success rate: ${metrics.successRate}%`);
  console.log(`- Average response time: ${Math.round(metrics.averageResponseTime)}ms`);
  
  if (errorSummary.totalErrors > 0) {
    console.log('Error Summary:');
    console.log(`- Total errors: ${errorSummary.totalErrors}`);
    console.log('- Error types:', errorSummary.errorTypes);
  }
  
  return results;
};
```

## 🔧 Utility Functions

### **Common Helper Functions**

```javascript
// URL validation
const isValidUrl = (url) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Generate product codes from scraped data
const generateProductCode = (name, brand = '') => {
  const cleanName = name.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const cleanBrand = brand.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  const prefix = cleanBrand ? cleanBrand.substring(0, 3) : 'SCR';
  const suffix = cleanName.substring(0, 8);
  
  return `${prefix}-${suffix}`;
};

// Extract domain from URL
const extractDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
};

// Format execution time
const formatExecutionTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## 📱 Mobile-First Examples

### **React Native Example**

```javascript
// React Native scraping service
import AsyncStorage from '@react-native-async-storage/async-storage';

class ScrapingApiService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/v1/scraping';
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

  async scrapeUrl(url, options = {}) {
    const params = new URLSearchParams({
      url,
      ...options
    });
    
    return await this.makeRequest(`/scrape?${params}`);
  }

  async checkHealth() {
    return await this.makeRequest('/health');
  }
}

export default new ScrapingApiService();
```

---

*This document provides practical examples for implementing the Scraping API in various scenarios. For complete API documentation, see `SCRAPING_API_ENDPOINTS.md`.*
