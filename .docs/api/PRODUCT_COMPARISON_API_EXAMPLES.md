# 🔍 Product Comparison API - Practical Examples

## 📋 Overview

This document provides practical examples and use cases for the Product Comparison API, showing real-world scenarios for implementing price comparison functionality in frontend applications.

## 🎯 Common Use Cases

### 1. **Product Search and Comparison Interface**

#### **Scenario**: Build a search interface that allows users to find products and compare prices across stores

```javascript
// Product search and comparison component
class ProductComparisonTool {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async searchProducts(query) {
    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProductComparison(baseProductId) {
    const response = await fetch(`${this.apiBaseUrl}/${baseProductId}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Comparison failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
```

#### **React Component Example**
```jsx
import React, { useState, useEffect } from 'react';

const ProductComparisonInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchProducts = async (query) => {
    if (query.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/product-comparison/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getComparison = async (baseProductId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/product-comparison/${baseProductId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setComparison(data);
      setSelectedProduct(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchProducts(searchQuery);
  };

  const handleProductSelect = (product) => {
    getComparison(product.id);
  };

  return (
    <div className="product-comparison-interface">
      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for products to compare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" disabled={loading || searchQuery.length < 2}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="product-list">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                onClick={() => handleProductSelect(product)}
              >
                <div className="product-info">
                  <h4>{product.fullName}</h4>
                  <p>Available in {product.storeCount} stores</p>
                  <p>{product.totalVariants} variants</p>
                </div>
                {product.image && (
                  <img src={product.image} alt={product.name} className="product-image" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {comparison && (
        <div className="comparison-section">
          <h3>Price Comparison: {comparison.product.fullName}</h3>
          
          <div className="price-summary">
            <div className="price-range">
              <span className="min-price">${comparison.priceRange.min}</span>
              <span className="max-price">${comparison.priceRange.max}</span>
              <span className="avg-price">Avg: ${comparison.priceRange.avg}</span>
            </div>
            <p>Available in {comparison.totalStores} stores</p>
          </div>

          <div className="store-comparison">
            {comparison.stores
              .sort((a, b) => a.price - b.price)
              .map((storeData, index) => (
                <div key={storeData.store.id} className={`store-item ${index === 0 ? 'best-price' : ''}`}>
                  <div className="store-info">
                    <h4>{storeData.store.name}</h4>
                    <p className="store-type">{storeData.store.type}</p>
                    {storeData.store.isVerified && (
                      <span className="verified-badge">Verified</span>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h5>{storeData.product.name}</h5>
                    <p className="price">${storeData.product.price}</p>
                    {storeData.product.url && (
                      <a 
                        href={storeData.product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="store-link"
                      >
                        View in Store
                      </a>
                    )}
                  </div>

                  {storeData.product.image && (
                    <img 
                      src={storeData.product.image} 
                      alt={storeData.product.name}
                      className="product-image"
                    />
                  )}

                  {index === 0 && (
                    <div className="best-price-badge">Best Price!</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. **Price Alert System**

#### **Scenario**: Implement a price alert system that notifies users when prices drop

```javascript
// Price alert system
class PriceAlertSystem {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.alerts = new Map();
  }

  async createPriceAlert(baseProductId, targetPrice, userId) {
    const comparison = await this.getProductComparison(baseProductId);
    const currentMinPrice = comparison.priceRange.min;

    if (currentMinPrice <= targetPrice) {
      return {
        success: false,
        message: `Current minimum price ($${currentMinPrice}) is already at or below target price ($${targetPrice})`
      };
    }

    const alert = {
      id: `alert_${Date.now()}`,
      baseProductId,
      targetPrice,
      userId,
      productName: comparison.product.fullName,
      currentMinPrice,
      createdAt: new Date(),
      isActive: true
    };

    this.alerts.set(alert.id, alert);
    return { success: true, alert };
  }

  async checkPriceAlerts() {
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.isActive);
    const triggeredAlerts = [];

    for (const alert of activeAlerts) {
      try {
        const comparison = await this.getProductComparison(alert.baseProductId);
        const currentMinPrice = comparison.priceRange.min;

        if (currentMinPrice <= alert.targetPrice) {
          alert.isActive = false;
          alert.triggeredAt = new Date();
          alert.triggeredPrice = currentMinPrice;
          
          triggeredAlerts.push({
            ...alert,
            comparison,
            savings: alert.currentMinPrice - currentMinPrice
          });
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    return triggeredAlerts;
  }

  async getProductComparison(baseProductId) {
    const response = await fetch(`${this.apiBaseUrl}/${baseProductId}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get comparison: ${response.statusText}`);
    }

    return await response.json();
  }

  getUserAlerts(userId) {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  cancelAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      alert.cancelledAt = new Date();
      return true;
    }
    return false;
  }
}
```

#### **Price Alert Component**
```jsx
const PriceAlertManager = ({ userId }) => {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    baseProductId: '',
    targetPrice: '',
    productName: ''
  });
  const [loading, setLoading] = useState(false);

  const alertSystem = new PriceAlertSystem('/api/v1/product-comparison', token);

  useEffect(() => {
    loadUserAlerts();
  }, [userId]);

  const loadUserAlerts = () => {
    const userAlerts = alertSystem.getUserAlerts(userId);
    setAlerts(userAlerts);
  };

  const createAlert = async (e) => {
    e.preventDefault();
    
    if (!newAlert.baseProductId || !newAlert.targetPrice) return;

    setLoading(true);
    try {
      const result = await alertSystem.createPriceAlert(
        newAlert.baseProductId,
        parseFloat(newAlert.targetPrice),
        userId
      );

      if (result.success) {
        setAlerts(prev => [result.alert, ...prev]);
        setNewAlert({ baseProductId: '', targetPrice: '', productName: '' });
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to create price alert: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelAlert = (alertId) => {
    if (alertSystem.cancelAlert(alertId)) {
      loadUserAlerts();
    }
  };

  return (
    <div className="price-alert-manager">
      <h3>Price Alerts</h3>
      
      <form onSubmit={createAlert} className="alert-form">
        <input
          type="text"
          placeholder="Product ID"
          value={newAlert.baseProductId}
          onChange={(e) => setNewAlert({...newAlert, baseProductId: e.target.value})}
        />
        <input
          type="number"
          placeholder="Target Price"
          value={newAlert.targetPrice}
          onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
          step="0.01"
          min="0"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Alert'}
        </button>
      </form>

      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-item ${alert.isActive ? 'active' : 'inactive'}`}>
            <div className="alert-info">
              <h4>{alert.productName}</h4>
              <p>Target: ${alert.targetPrice}</p>
              <p>Current: ${alert.currentMinPrice}</p>
              {alert.triggeredAt && (
                <p className="triggered">
                  Triggered at ${alert.triggeredPrice} on {new Date(alert.triggeredAt).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {alert.isActive && (
              <button onClick={() => cancelAlert(alert.id)} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. **Bulk Product Comparison**

#### **Scenario**: Compare multiple products at once for bulk purchasing decisions

```javascript
// Bulk product comparison
class BulkProductComparison {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async compareMultipleProducts(baseProductIds) {
    const comparisons = await Promise.all(
      baseProductIds.map(async (id) => {
        try {
          const comparison = await this.getProductComparison(id);
          return { success: true, data: comparison };
        } catch (error) {
          return { success: false, error: error.message, id };
        }
      })
    );

    const successful = comparisons.filter(c => c.success);
    const failed = comparisons.filter(c => !c.success);

    return {
      successful: successful.map(c => c.data),
      failed,
      summary: {
        total: baseProductIds.length,
        successful: successful.length,
        failed: failed.length
      }
    };
  }

  async getProductComparison(baseProductId) {
    const response = await fetch(`${this.apiBaseUrl}/${baseProductId}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get comparison: ${response.statusText}`);
    }

    return await response.json();
  }

  generateBulkReport(comparisons) {
    const report = {
      totalProducts: comparisons.length,
      totalStores: new Set(comparisons.flatMap(c => c.stores.map(s => s.store.id))).size,
      averagePrice: 0,
      bestDeals: [],
      worstDeals: [],
      storeRankings: new Map()
    };

    let totalPrice = 0;
    let totalComparisons = 0;

    comparisons.forEach(comparison => {
      const prices = comparison.stores.map(s => s.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      totalPrice += minPrice;
      totalComparisons++;

      // Find best and worst deals
      const bestDeal = comparison.stores.find(s => s.price === minPrice);
      const worstDeal = comparison.stores.find(s => s.price === maxPrice);

      report.bestDeals.push({
        product: comparison.product.fullName,
        store: bestDeal.store.name,
        price: bestDeal.price,
        savings: maxPrice - minPrice
      });

      report.worstDeals.push({
        product: comparison.product.fullName,
        store: worstDeal.store.name,
        price: worstDeal.price
      });

      // Track store performance
      comparison.stores.forEach(storeData => {
        const storeId = storeData.store.id;
        if (!report.storeRankings.has(storeId)) {
          report.storeRankings.set(storeId, {
            name: storeData.store.name,
            totalProducts: 0,
            bestPrices: 0,
            averagePrice: 0,
            totalPrice: 0
          });
        }

        const storeStats = report.storeRankings.get(storeId);
        storeStats.totalProducts++;
        storeStats.totalPrice += storeData.price;
        storeStats.averagePrice = storeStats.totalPrice / storeStats.totalProducts;

        if (storeData.price === minPrice) {
          storeStats.bestPrices++;
        }
      });
    });

    report.averagePrice = totalPrice / totalComparisons;
    report.bestDeals.sort((a, b) => b.savings - a.savings);
    report.worstDeals.sort((a, b) => b.price - a.price);

    return report;
  }
}
```

#### **Bulk Comparison Component**
```jsx
const BulkProductComparison = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const bulkComparison = new BulkProductComparison('/api/v1/product-comparison', token);

  const addProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const runBulkComparison = async () => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      const baseProductIds = selectedProducts.map(p => p.id);
      const result = await bulkComparison.compareMultipleProducts(baseProductIds);
      
      setComparisons(result.successful);
      
      if (result.successful.length > 0) {
        const report = bulkComparison.generateBulkReport(result.successful);
        setReport(report);
      }
    } catch (error) {
      console.error('Bulk comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-comparison">
      <h3>Bulk Product Comparison</h3>
      
      <div className="selected-products">
        <h4>Selected Products ({selectedProducts.length})</h4>
        {selectedProducts.map(product => (
          <div key={product.id} className="selected-product">
            <span>{product.fullName}</span>
            <button onClick={() => removeProduct(product.id)}>Remove</button>
          </div>
        ))}
      </div>

      <button 
        onClick={runBulkComparison} 
        disabled={loading || selectedProducts.length === 0}
        className="compare-btn"
      >
        {loading ? 'Comparing...' : `Compare ${selectedProducts.length} Products`}
      </button>

      {report && (
        <div className="bulk-report">
          <h4>Bulk Comparison Report</h4>
          
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Total Products:</span>
              <span className="value">{report.totalProducts}</span>
            </div>
            <div className="stat">
              <span className="label">Total Stores:</span>
              <span className="value">{report.totalStores}</span>
            </div>
            <div className="stat">
              <span className="label">Average Price:</span>
              <span className="value">${report.averagePrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="best-deals">
            <h5>Best Deals</h5>
            {report.bestDeals.slice(0, 5).map((deal, index) => (
              <div key={index} className="deal-item">
                <span className="product">{deal.product}</span>
                <span className="store">{deal.store}</span>
                <span className="price">${deal.price}</span>
                <span className="savings">Save ${deal.savings.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="store-rankings">
            <h5>Store Performance</h5>
            {Array.from(report.storeRankings.values())
              .sort((a, b) => b.bestPrices - a.bestPrices)
              .map((store, index) => (
                <div key={index} className="store-ranking">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{store.name}</span>
                  <span className="best-prices">{store.bestPrices} best prices</span>
                  <span className="avg-price">Avg: ${store.averagePrice.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4. **Real-time Price Monitoring Dashboard**

#### **Scenario**: Create a dashboard that monitors price changes in real-time

```javascript
// Real-time price monitoring
class PriceMonitoringDashboard {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.monitoredProducts = new Map();
    this.priceHistory = new Map();
    this.updateInterval = null;
  }

  startMonitoring(baseProductIds, intervalMs = 300000) { // 5 minutes default
    baseProductIds.forEach(id => {
      this.monitoredProducts.set(id, {
        id,
        lastUpdate: null,
        currentPrice: null,
        priceChanges: []
      });
    });

    this.updateInterval = setInterval(() => {
      this.updateAllPrices();
    }, intervalMs);

    // Initial update
    this.updateAllPrices();
  }

  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateAllPrices() {
    const updatePromises = Array.from(this.monitoredProducts.keys()).map(id => 
      this.updateProductPrice(id)
    );

    await Promise.all(updatePromises);
  }

  async updateProductPrice(baseProductId) {
    try {
      const comparison = await this.getProductComparison(baseProductId);
      const minPrice = comparison.priceRange.min;
      const product = this.monitoredProducts.get(baseProductId);

      if (product.currentPrice !== null && product.currentPrice !== minPrice) {
        const priceChange = {
          timestamp: new Date(),
          oldPrice: product.currentPrice,
          newPrice: minPrice,
          change: minPrice - product.currentPrice,
          changePercent: ((minPrice - product.currentPrice) / product.currentPrice) * 100
        };

        product.priceChanges.push(priceChange);
        
        // Keep only last 50 changes
        if (product.priceChanges.length > 50) {
          product.priceChanges = product.priceChanges.slice(-50);
        }

        // Emit price change event
        this.emitPriceChange(baseProductId, priceChange);
      }

      product.currentPrice = minPrice;
      product.lastUpdate = new Date();

    } catch (error) {
      console.error(`Failed to update price for product ${baseProductId}:`, error);
    }
  }

  async getProductComparison(baseProductId) {
    const response = await fetch(`${this.apiBaseUrl}/${baseProductId}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get comparison: ${response.statusText}`);
    }

    return await response.json();
  }

  emitPriceChange(baseProductId, priceChange) {
    // Custom event for price changes
    const event = new CustomEvent('priceChange', {
      detail: {
        baseProductId,
        priceChange,
        product: this.monitoredProducts.get(baseProductId)
      }
    });
    window.dispatchEvent(event);
  }

  getPriceHistory(baseProductId) {
    return this.monitoredProducts.get(baseProductId)?.priceChanges || [];
  }

  getMonitoringStatus() {
    return {
      monitoredProducts: this.monitoredProducts.size,
      isActive: this.updateInterval !== null,
      lastUpdate: Math.max(...Array.from(this.monitoredProducts.values()).map(p => p.lastUpdate?.getTime() || 0))
    };
  }
}
```

#### **Price Monitoring Dashboard Component**
```jsx
const PriceMonitoringDashboard = () => {
  const [monitoredProducts, setMonitoredProducts] = useState([]);
  const [priceChanges, setPriceChanges] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dashboard] = useState(new PriceMonitoringDashboard('/api/v1/product-comparison', token));

  useEffect(() => {
    const handlePriceChange = (event) => {
      const { baseProductId, priceChange } = event.detail;
      setPriceChanges(prev => [priceChange, ...prev.slice(0, 99)]); // Keep last 100 changes
    };

    window.addEventListener('priceChange', handlePriceChange);
    return () => window.removeEventListener('priceChange', handlePriceChange);
  }, []);

  const startMonitoring = (baseProductIds) => {
    dashboard.startMonitoring(baseProductIds);
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    dashboard.stopMonitoring();
    setIsMonitoring(false);
  };

  const getPriceTrend = (baseProductId) => {
    const history = dashboard.getPriceHistory(baseProductId);
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const trend = recent.reduce((acc, change) => acc + change.change, 0);
    
    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  };

  return (
    <div className="price-monitoring-dashboard">
      <h3>Price Monitoring Dashboard</h3>
      
      <div className="monitoring-controls">
        <button 
          onClick={() => startMonitoring(monitoredProducts.map(p => p.id))}
          disabled={isMonitoring || monitoredProducts.length === 0}
        >
          Start Monitoring
        </button>
        <button 
          onClick={stopMonitoring}
          disabled={!isMonitoring}
        >
          Stop Monitoring
        </button>
      </div>

      <div className="monitored-products">
        <h4>Monitored Products</h4>
        {monitoredProducts.map(product => {
          const trend = getPriceTrend(product.id);
          return (
            <div key={product.id} className="monitored-product">
              <div className="product-info">
                <h5>{product.fullName}</h5>
                <p>Current: ${product.currentPrice}</p>
                <p className={`trend ${trend}`}>
                  {trend === 'increasing' ? '↗️' : trend === 'decreasing' ? '↘️' : '➡️'} {trend}
                </p>
              </div>
              <div className="price-chart">
                {/* Price chart visualization would go here */}
              </div>
            </div>
          );
        })}
      </div>

      <div className="recent-changes">
        <h4>Recent Price Changes</h4>
        {priceChanges.slice(0, 10).map((change, index) => (
          <div key={index} className={`price-change ${change.change > 0 ? 'increase' : 'decrease'}`}>
            <span className="timestamp">
              {new Date(change.timestamp).toLocaleTimeString()}
            </span>
            <span className="change">
              {change.change > 0 ? '+' : ''}${change.change.toFixed(2)} 
              ({change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔧 Utility Functions

### **Common Helper Functions**

```javascript
// Format price for display
const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};

// Calculate price difference
const calculatePriceDifference = (oldPrice, newPrice) => {
  const difference = newPrice - oldPrice;
  const percentChange = (difference / oldPrice) * 100;
  
  return {
    difference,
    percentChange,
    isIncrease: difference > 0,
    isDecrease: difference < 0
  };
};

// Sort stores by price
const sortStoresByPrice = (stores, ascending = true) => {
  return [...stores].sort((a, b) => 
    ascending ? a.price - b.price : b.price - a.price
  );
};

// Find best deal
const findBestDeal = (comparison) => {
  return comparison.stores.reduce((best, current) => 
    current.price < best.price ? current : best
  );
};

// Calculate total savings
const calculateTotalSavings = (comparisons) => {
  return comparisons.reduce((total, comparison) => {
    const prices = comparison.stores.map(s => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return total + (maxPrice - minPrice);
  }, 0);
};

// Generate comparison report
const generateComparisonReport = (comparisons) => {
  const report = {
    totalProducts: comparisons.length,
    totalStores: new Set(comparisons.flatMap(c => c.stores.map(s => s.store.id))).size,
    averagePrice: 0,
    totalSavings: 0,
    bestDeals: [],
    storePerformance: new Map()
  };

  let totalPrice = 0;
  let totalComparisons = 0;

  comparisons.forEach(comparison => {
    const prices = comparison.stores.map(s => s.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    totalPrice += minPrice;
    totalComparisons++;
    report.totalSavings += (maxPrice - minPrice);

    // Find best deal
    const bestDeal = comparison.stores.find(s => s.price === minPrice);
    report.bestDeals.push({
      product: comparison.product.fullName,
      store: bestDeal.store.name,
      price: bestDeal.price,
      savings: maxPrice - minPrice
    });

    // Track store performance
    comparison.stores.forEach(storeData => {
      const storeId = storeData.store.id;
      if (!report.storePerformance.has(storeId)) {
        report.storePerformance.set(storeId, {
          name: storeData.store.name,
          totalProducts: 0,
          bestPrices: 0,
          totalPrice: 0
        });
      }

      const storeStats = report.storePerformance.get(storeId);
      storeStats.totalProducts++;
      storeStats.totalPrice += storeData.price;

      if (storeData.price === minPrice) {
        storeStats.bestPrices++;
      }
    });
  });

  report.averagePrice = totalPrice / totalComparisons;
  report.bestDeals.sort((a, b) => b.savings - a.savings);

  return report;
};
```

## 📱 Mobile-First Examples

### **React Native Example**

```javascript
// React Native product comparison service
import AsyncStorage from '@react-native-async-storage/async-storage';

class ProductComparisonService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/v1/product-comparison';
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

  async searchProducts(query) {
    return await this.makeRequest(`/search?q=${encodeURIComponent(query)}`);
  }

  async getProductComparison(baseProductId) {
    return await this.makeRequest(`/${baseProductId}`);
  }
}

export default new ProductComparisonService();
```

---

*This document provides practical examples for implementing the Product Comparison API in various frontend scenarios. For complete API documentation, see `PRODUCT_COMPARISON_API_ENDPOINTS.md`.*

