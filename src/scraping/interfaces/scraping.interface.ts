export interface IScrapingRequest {
  url: string;
}

export interface IScrapingResponse {
  success: boolean;
  html?: string;
  url: string;
  timestamp: Date;
  executionTime: number;
  error?: string;
}

export interface IScrapingOptions {
  timeout?: number;
  waitForSelector?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface IScrapingResult {
  html: string;
  url: string;
  title?: string;
  metadata?: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
}
