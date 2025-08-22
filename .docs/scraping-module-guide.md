# Scraping Module - User Guide

## Overview
The Scraping Module provides web scraping capabilities for any website, allowing you to extract HTML content from dynamic web pages that use JavaScript to load content.

## Features
- **Dynamic Content Support**: Captures JavaScript-rendered content
- **Configurable Timeouts**: Adjustable waiting times with intelligent fallbacks
- **Advanced Anti-Detection**: Comprehensive measures to avoid bot detection
- **Flexible Navigation**: Automatic fallback strategies for different sites
- **Human Behavior Simulation**: Mimics real user interactions
- **Universal URL Support**: Works with any HTTP/HTTPS website
- **Role-Based Access**: Secure access control for different user types
- **Health Monitoring**: Built-in health checks and service information

## Prerequisites
- Valid JWT authentication token
- Appropriate role permissions (SUPER_ADMIN, ADMIN, or STORE_ADMIN)
- Access to any valid HTTP/HTTPS URL

## Technical Architecture

### Anti-Detection System
The module implements a comprehensive anti-detection system:

- **User Agent Rotation**: 5 different Chrome user agents randomly selected
- **Browser Fingerprinting Removal**: Eliminates automation properties
- **Header Spoofing**: Realistic browser headers and security tokens
- **JavaScript Injection**: Removes webdriver properties and mocks APIs
- **Sandbox Disabling**: Multiple Chrome flags to avoid detection

### Navigation Strategy
Intelligent navigation with automatic fallbacks:

1. **Primary Strategy**: Wait for `networkidle` state (30s timeout)
2. **Fallback Strategy**: Use `domcontentloaded` if networkidle fails
3. **Content Waiting**: Flexible approach with automatic fallbacks
4. **Timeout Optimization**: Reduced timeouts for faster response

### Human Behavior Simulation
Mimics real user behavior to avoid detection:

- **Random Delays**: 1-3 second delays between actions
- **Mouse Movements**: Random cursor positioning
- **Scroll Simulation**: Random scroll amounts
- **Natural Patterns**: Realistic interaction timing

## API Endpoints

### 1. Scrape URL Endpoint
**Endpoint**: `GET /scraping/scrape`

**Description**: Scrapes HTML content from any URL, waiting for dynamic content to load.

**Authentication**: Required (JWT token)

**Required Role**: SUPER_ADMIN, ADMIN, or STORE_ADMIN

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `url` | string | ✅ | URL to scrape (any valid HTTP/HTTPS URL) | `https://www.example.com/page` |
| `timeout` | number | ❌ | Timeout in milliseconds (5000-120000) | `30000` |
| `waitForSelector` | string | ❌ | CSS selector to wait for | `[data-cnstrc-item-id]` |
| `userAgent` | string | ❌ | Custom user agent string | Custom browser string |

#### Example Request
```bash
curl -X GET "http://localhost:3000/scraping/scrape?url=https://www.example.com/page&timeout=30000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "html": "<html><body>...</body></html>",
  "url": "https://www.example.com/page",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "executionTime": 2500
}
```

### 2. Health Check Endpoint
**Endpoint**: `GET /scraping/health`

**Description**: Checks if the scraping service is working correctly.

**Authentication**: Not required

#### Example Request
```bash
curl -X GET "http://localhost:3000/scraping/health"
```

#### Example Response
```json
{
  "status": "ok",
  "service": "scraping",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "browser": true
}
```

### 3. Service Information Endpoint
**Endpoint**: `GET /scraping/info`

**Description**: Returns information about the scraping service capabilities.

**Authentication**: Not required

#### Example Request
```bash
curl -X GET "http://localhost:3000/scraping/info"
```

#### Example Response
```json
{
  "service": "scraping",
  "version": "1.0.0",
  "capabilities": {
    "browser": "chromium",
    "headless": true,
    "supportedDomains": ["any HTTP/HTTPS domain"],
    "defaultTimeout": 30000,
    "defaultSelector": "[data-cnstrc-item-id]",
    "features": [
      "JavaScript rendering",
      "Dynamic content waiting",
      "Metadata extraction",
      "Anti-detection measures",
      "Configurable timeouts"
    ]
  },
  "timestamp": "2025-01-21T10:30:00.000Z"
}
```

## Usage Examples

### Basic Scraping
```bash
# Scrape a product page with default settings
curl -X GET "http://localhost:3000/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Custom Timeout
```bash
# Scrape with custom timeout (60 seconds)
curl -X GET "http://localhost:3000/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&timeout=60000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Custom Selector
```bash
# Wait for a different CSS selector
curl -X GET "http://localhost:3000/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&waitForSelector=.product-grid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Custom User Agent
```bash# Scrape with custom user agent
curl -X GET "http://localhost:3000/scraping/scrape?url=https://jumbo.cl/marcas-exclusivas&userAgent=Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit/537.36" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Best Practices

### 1. Timeout Configuration
- **Default timeout**: 30 seconds (30000ms)
- **Minimum timeout**: 5 seconds (5000ms)
- **Maximum timeout**: 120 seconds (120000ms)
- **Recommendation**: Use 30-45 seconds for most pages

### 2. Selector Strategy
- **Default selector**: `[data-cnstrc-item-id]` (for reference, but not required)
- **Custom selectors**: Use specific CSS selectors for your use case
- **Wait strategy**: Service uses flexible waiting with automatic fallbacks

### 3. Error Handling
- **Network errors**: Check URL accessibility and network connectivity
- **Timeout errors**: Increase timeout or check if selector exists
- **Authentication errors**: Verify JWT token and role permissions
- **Domain errors**: Only Jumbo.cl URLs are allowed

### 4. Performance Optimization
- **Browser cleanup**: Service automatically closes browser after each request
- **Resource management**: Headless mode for minimal resource usage
- **Concurrent requests**: Avoid multiple simultaneous scraping requests
- **Navigation fallbacks**: Automatic fallback strategies for faster response
- **Timeout optimization**: Intelligent timeout management with fallbacks

## Common Issues and Solutions

### Issue: "Content did not load within timeout"
**Cause**: Page takes longer than expected to load or selector doesn't exist
**Solution**: 
- Increase timeout parameter
- Verify the CSS selector exists on the page
- Check if the page structure has changed

### Issue: "Only Jumbo.cl URLs are allowed"
**Cause**: This error no longer occurs - any HTTP/HTTPS URL is now allowed
**Solution**: Use any valid website URL (HTTP/HTTPS protocol required)

### Issue: "Scraping service is unhealthy"
**Cause**: Browser launch failed or service unavailable
**Solution**: 
- Check system resources
- Verify Playwright installation
- Contact system administrator

### Issue: "Forbidden - Insufficient permissions"
**Cause**: User role doesn't have scraping permissions
**Solution**: 
- Verify user has SUPER_ADMIN, ADMIN, or STORE_ADMIN role
- Check JWT token validity
- Contact system administrator for role assignment

## Use Cases

### E-commerce Sites
- **Jumbo.cl**: Product catalog scraping, price monitoring
- **Unimarc.cl**: Category page analysis, inventory tracking
- **Other retailers**: Price comparison, product availability
- **Marketplaces**: Product listing analysis, seller information

### Content Sites
- **News websites**: Article content extraction, headline monitoring
- **Blog platforms**: Post content analysis, trend identification
- **Social media**: Public content monitoring, engagement tracking
- **Documentation**: Technical content extraction, API documentation

### Business Intelligence
- **Competitor analysis**: Price comparison, feature monitoring
- **Market research**: Product availability, market trends
- **Content monitoring**: Website changes, update tracking
- **SEO analysis**: Content structure, meta information

### Data Collection
- **Research projects**: Academic data collection
- **Market analysis**: Industry trend monitoring
- **Content aggregation**: Multi-source information gathering
- **Monitoring systems**: Website change detection

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function scrapeWebPage(url, token) {
  try {
    const response = await axios.get(`http://localhost:3000/scraping/scrape`, {
      params: { url },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Scraping failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage examples
scrapeWebPage('https://www.jumbo.cl/marcas-exclusivas', 'your-jwt-token')
  .then(result => console.log('Jumbo HTML:', result.html))
  .catch(error => console.error('Error:', error));

scrapeWebPage('https://www.unimarc.cl/category/despensa', 'your-jwt-token')
  .then(result => console.log('Unimarc HTML:', result.html))
  .catch(error => console.error('Error:', error));
```

### Python
```python
import requests

def scrape_web_page(url, token):
    try:
        response = requests.get(
            'http://localhost:3000/scraping/scrape',
            params={'url': url},
            headers={'Authorization': f'Bearer {token}'}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Scraping failed: {e}')
        raise

# Usage examples
result = scrape_web_page('https://www.jumbo.cl/marcas-exclusivas', 'your-jwt-token')
print(f'Jumbo HTML: {result["html"]}')

result = scrape_web_page('https://www.unimarc.cl/category/despensa', 'your-jwt-token')
print(f'Unimarc HTML: {result["html"]}')
```

## Monitoring and Health Checks

### Regular Health Monitoring
```bash
# Check service health every 5 minutes
*/5 * * * * curl -s http://localhost:3000/scraping/health > /dev/null || echo "Scraping service down"
```

### Service Information
```bash
# Get service capabilities
curl -s http://localhost:3000/scraping/info | jq '.capabilities'
```

## Security Considerations

### Authentication
- All scraping endpoints require valid JWT tokens
- Tokens expire based on system configuration
- Store tokens securely and rotate regularly

### Authorization
- Role-based access control (RBAC) implementation
- Only authorized users can perform scraping operations
- Audit logging for all scraping activities

### Rate Limiting
- Consider implementing rate limiting for production use
- Monitor scraping frequency to avoid overwhelming target sites
- Respect robots.txt and site terms of service

## Support and Troubleshooting

### Logs
- Check application logs for detailed error information
- Monitor scraping performance and success rates
- Look for timeout and authentication errors

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid URL or parameters)
- **401**: Unauthorized (invalid or missing JWT token)
- **403**: Forbidden (insufficient permissions)
- **500**: Internal Server Error (scraping failed)
- **503**: Service Unavailable (service unhealthy)

### Getting Help
- Check this documentation first
- Review application logs for error details
- Contact system administrator for technical issues
- Verify JWT token and role permissions
