import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import {
  IScrapingOptions,
  IScrapingResult,
  IScrapingResponse,
} from '../interfaces/scraping.interface';
import { ScrapeUrlDto } from '../dto/scrape-url.dto';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  private readonly defaultOptions: IScrapingOptions = {
    timeout: 10000, // Reduced timeout for faster response
    waitForSelector: undefined, // No waiting for specific selectors
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    viewport: {
      width: 1920,
      height: 1080,
    },
  };

  // Random user agents to rotate
  private readonly userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  ];

  // Alternative selectors for different page types
  private readonly alternativeSelectors = [
    '[data-cnstrc-item-id]', // Product grid items
    '.product-item', // Generic product items
    '.product-card', // Product cards
    '.product-grid', // Product grid
    '.product-list', // Product list
    '.product', // Generic product
    '.item', // Generic items
    '.card', // Generic cards
    'main', // Main content
    'body', // Fallback to body
  ];

  /**
   * Fast method to capture HTML content from a URL
   * Optimized for speed - blocks external resources and uses minimal waiting
   */
  async getHtmlFast(scrapeDto: ScrapeUrlDto): Promise<IScrapingResponse> {
    const startTime = Date.now();
    let browser: Browser | null = null;

    try {
      // this.logger.log(`Starting fast HTML capture for URL: ${scrapeDto.url}`);

      // Validate URL format and accessibility
      this.validateUrl(scrapeDto.url);

      // Merge options with fast defaults
      const options = this.mergeFastOptions(scrapeDto);

      // Launch browser
      browser = await this.launchBrowser(options);

      // Create new page and navigate
      const page = await this.createPage(browser, options);
      await this.navigateToUrl(page, scrapeDto.url);

      // Minimal wait for content
      await this.waitForContent(page, options);

      // Get page content
      const result = await this.extractContent(page);

      const executionTime = Date.now() - startTime;
      // this.logger.log(`Fast HTML capture completed successfully in ${executionTime}ms`);

      return {
        success: true,
        html: result.html,
        url: scrapeDto.url,
        timestamp: new Date(),
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Fast HTML capture failed for ${scrapeDto.url}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        url: scrapeDto.url,
        timestamp: new Date(),
        executionTime,
        error: error.message,
      };
    } finally {
      // Always close browser
      if (browser) {
        await browser.close();
        // this.logger.log('Browser closed');
      }
    }
  }

  /**
   * Main method to capture HTML content from a URL
   * Simple approach: navigate and capture HTML without complex validation
   */
  async getHtml(scrapeDto: ScrapeUrlDto): Promise<IScrapingResponse> {
    const startTime = Date.now();
    let browser: Browser | null = null;

    try {
      // this.logger.log(`Starting HTML capture for URL: ${scrapeDto.url}`);

      // Validate URL format and accessibility
      this.validateUrl(scrapeDto.url);

      // Merge options with defaults
      const options = this.mergeOptions(scrapeDto);

      // Launch browser
      browser = await this.launchBrowser(options);

      // Create new page and navigate
      const page = await this.createPage(browser, options);
      await this.navigateToUrl(page, scrapeDto.url);

      // Wait for page to load (simple approach)
      await this.waitForContent(page, options);

      // Get page content
      const result = await this.extractContent(page);

      const executionTime = Date.now() - startTime;
      // this.logger.log(`HTML capture completed successfully in ${executionTime}ms`);

      return {
        success: true,
        html: result.html,
        url: scrapeDto.url,
        timestamp: new Date(),
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `HTML capture failed for ${scrapeDto.url}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        url: scrapeDto.url,
        timestamp: new Date(),
        executionTime,
        error: error.message,
      };
    } finally {
      // Always close browser
      if (browser) {
        await browser.close();
        // this.logger.log('Browser closed');
      }
    }
  }

  /**
   * Launch browser with configured options
   */
  private async launchBrowser(options: IScrapingOptions): Promise<Browser> {
    try {
      // Randomize user agent
      const randomUserAgent =
        this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      // this.logger.log(`Using user agent: ${randomUserAgent}`);

      return await chromium.launch({
        headless: true,
        executablePath:
          process.env.NODE_ENV === 'production'
            ? '/usr/bin/chromium-browser'
            : undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images', // Block images for speed
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-first-run',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--disable-safebrowsing',
          '--disable-blink-features=AutomationControlled',
        ],
      });
    } catch (error) {
      this.logger.error('Failed to launch browser', error);
      throw new InternalServerErrorException(
        'Failed to launch browser for scraping',
      );
    }
  }

  /**
   * Create and configure a new page
   */
  private async createPage(
    browser: Browser,
    options: IScrapingOptions,
  ): Promise<Page> {
    const page = await browser.newPage();

    // Randomize user agent if not provided
    const userAgent =
      options.userAgent ||
      this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgent,
    });

    // Set viewport
    if (options.viewport) {
      await page.setViewportSize(options.viewport);
    }

    // Block only heavy resources but allow essential ones for dynamic content
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();

      // Allow document, script, and XHR/fetch requests
      if (['document', 'script', 'xhr', 'fetch'].includes(resourceType)) {
        route.continue();
      }
      // Block only images and media (heavy resources)
      else if (['image', 'media'].includes(resourceType)) {
        route.abort();
      }
      // Allow stylesheets and fonts (needed for proper layout)
      else if (['stylesheet', 'font'].includes(resourceType)) {
        route.continue();
      }
      // Allow other resources
      else {
        route.continue();
      }
    });

    // Set additional headers to avoid detection
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="136", "Not_A Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': userAgent,
    });

    // Remove webdriver property to avoid detection
    await page.evaluate(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Remove automation properties
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es', 'en-US', 'en'],
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({
            state: Notification.permission,
            name: 'notifications',
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as PermissionStatus);
        }
        return originalQuery(parameters);
      };

      // Mock chrome runtime only if it doesn't exist
      if (!(window as any).chrome) {
        Object.defineProperty(window, 'chrome', {
          writable: true,
          enumerable: true,
          configurable: true,
          value: {
            runtime: {},
          },
        });
      }
    });

    return page;
  }

  /**
   * Navigate to the target URL - balanced for JavaScript and speed
   */
  private async navigateToUrl(page: Page, url: string): Promise<void> {
    try {
      // this.logger.log(`Navigating to: ${url}`);

      // Use domcontentloaded for faster response, then wait for specific content
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 8000, // Faster initial load
      });

      // this.logger.log('Navigation completed');
    } catch (error) {
      this.logger.error(`Navigation failed: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to navigate to URL: ${error.message}`,
      );
    }
  }

  /**
   * Simulate human-like behavior to avoid bot detection
   */
  private async simulateHumanBehavior(page: Page): Promise<void> {
    try {
      // Random delay between 1-3 seconds
      const delay = Math.random() * 2000 + 1000;
      await page.waitForTimeout(delay);

      // Simulate mouse movement (random pattern)
      const viewport = page.viewportSize();
      if (viewport) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await page.mouse.move(x, y);
      }

      // Simulate scroll (random amount)
      await page.evaluate(() => {
        const scrollAmount = Math.random() * 100 + 50;
        window.scrollBy(0, scrollAmount);
      });

      // Another small delay
      await page.waitForTimeout(500 + Math.random() * 1000);
    } catch (error) {
      // this.logger.warn(`Human behavior simulation failed: ${error.message}`);
      // Continue anyway, this is not critical
    }
  }

  /**
   * Wait for page to load - optimized for speed
   */
  private async waitForContent(
    page: Page,
    options: IScrapingOptions,
  ): Promise<void> {
    try {
      const { timeout, waitForSelector } = options;

      // this.logger.log(`Waiting for page to load with timeout: ${timeout}ms`);

      // If a specific selector is provided, wait for it (this is the key for dynamic content)
      if (waitForSelector) {
        try {
          // Use a fixed timeout for selectors - no need for user timeout here
          await page.waitForSelector(waitForSelector, {
            timeout: 5000, // Fixed 5 second timeout for selectors
          });
          // If selector found, we're done - no need to wait more
          return;
        } catch (selectorError) {
          this.logger.warn(
            `Selector ${waitForSelector} not found, continuing anyway: ${selectorError.message}`,
          );
        }
      }

      // If no selector, wait for network idle but with shorter timeout
      try {
        await page.waitForLoadState('networkidle', {
          timeout: Math.min(timeout || 10000, 5000), // Much shorter timeout
        });
      } catch (networkIdleError) {
        // Fallback to domcontentloaded if networkidle times out
        this.logger.warn(
          `Network idle timeout, falling back to DOM content loaded: ${networkIdleError.message}`,
        );
        await page.waitForLoadState('domcontentloaded', {
          timeout: Math.min(timeout || 10000, 3000),
        });
      }

      // Minimal additional wait only if no selector was provided
      if (!waitForSelector) {
        await page.waitForTimeout(1000); // Reduced from 3000ms
      }

      // this.logger.log('Page loaded successfully, ready to capture HTML');
    } catch (error) {
      this.logger.error(`Failed to wait for page load: ${error.message}`);

      // Even if timeout occurs, try to capture what we have
      // this.logger.log('Continuing with HTML capture despite timeout...');
    }
  }

  /**
   * Extract HTML content and metadata from the page
   */
  private async extractContent(page: Page): Promise<IScrapingResult> {
    try {
      // Get the complete HTML content
      const html = await page.content();

      // Extract additional metadata
      const title = await page.title();
      const metadata = await this.extractMetadata(page);

      return {
        html,
        url: page.url(),
        title,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to extract content: ${error.message}`);
      throw new InternalServerErrorException('Failed to extract page content');
    }
  }

  /**
   * Extract metadata from the page
   */
  private async extractMetadata(page: Page) {
    try {
      const metadata = await page.evaluate(() => {
        const getMetaContent = (name: string) => {
          const meta = document.querySelector(`meta[name="${name}"]`);
          return meta ? meta.getAttribute('content') : undefined;
        };

        const getOgContent = (property: string) => {
          const meta = document.querySelector(`meta[property="${property}"]`);
          return meta ? meta.getAttribute('content') : undefined;
        };

        return {
          description: getMetaContent('description'),
          keywords: getMetaContent('keywords'),
          ogTitle: getOgContent('og:title'),
          ogDescription: getOgContent('og:description'),
        };
      });

      return metadata;
    } catch (error) {
      this.logger.warn('Failed to extract metadata, continuing without it');
      return {};
    }
  }

  /**
   * Validate that the URL is valid and accessible
   */
  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url);

      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new BadRequestException('Only HTTP and HTTPS URLs are allowed');
      }

      // Check if hostname is valid
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        throw new BadRequestException('Invalid hostname');
      }

      // Log the URL being processed for debugging
      // this.logger.log(`Validated URL: ${urlObj.href}`);
      // this.logger.log(`Hostname: ${urlObj.hostname}`);
      // this.logger.log(`Path: ${urlObj.pathname}`);
      // this.logger.log(`Search params: ${urlObj.search}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid URL format');
    }
  }

  /**
   * Merge user options with fast defaults
   */
  private mergeFastOptions(scrapeDto: ScrapeUrlDto): IScrapingOptions {
    return {
      ...this.defaultOptions,
      timeout: Math.min(scrapeDto.timeout || 8000, 15000), // Cap at 15 seconds for faster response
      waitForSelector: scrapeDto.waitForSelector, // Allow waiting for specific selectors
      userAgent: scrapeDto.userAgent || this.defaultOptions.userAgent,
    };
  }

  /**
   * Merge user options with defaults
   */
  private mergeOptions(scrapeDto: ScrapeUrlDto): IScrapingOptions {
    return {
      ...this.defaultOptions,
      timeout: scrapeDto.timeout || this.defaultOptions.timeout,
      waitForSelector:
        scrapeDto.waitForSelector || this.defaultOptions.waitForSelector,
      userAgent: scrapeDto.userAgent || this.defaultOptions.userAgent,
    };
  }

  /**
   * Health check method for the scraping service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath:
          process.env.NODE_ENV === 'production'
            ? '/usr/bin/chromium-browser'
            : undefined,
      });
      await browser.close();
      return true;
    } catch (error) {
      this.logger.error('Scraping service health check failed', error);
      return false;
    }
  }
}
