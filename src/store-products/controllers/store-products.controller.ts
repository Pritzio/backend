import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { StoreProductsService } from '../services/store-products.service';
import { CreateStoreProductDto, UpdateStoreProductDto, ScrapingResultDto } from '../dto';
import { IStoreProductResponse, IStoreProductSummary, IStoreProductFilter, IStoreProductAnalytics, IStoreProductSearchResult, IScrapingJob } from '../interfaces/store-product.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { StoreProductStatus, Availability, ScrapingStatus } from '../entities/store-product.entity';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Store Products')
@Controller('api/v1/store-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoreProductsController {
  constructor(private readonly storeProductsService: StoreProductsService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Create a new store product' })
  @ApiResponse({ status: 201, description: 'Store product created successfully', type: CreateStoreProductDto })
  @ApiResponse({ status: 400, description: 'Bad request - Product already exists in store' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiBody({ type: CreateStoreProductDto })
  async createStoreProduct(
    @Body() createStoreProductDto: CreateStoreProductDto,
    @Request() req: any
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.createStoreProduct(createStoreProductDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all store products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Store products retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, description, store, or product' })
  @ApiQuery({ name: 'storeId', required: false, type: String, description: 'Filter by store ID' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'out_of_stock', 'discontinued', 'coming_soon', 'error'], description: 'Filter by status' })
  @ApiQuery({ name: 'availability', required: false, enum: ['in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'backorder'], description: 'Filter by availability' })
  @ApiQuery({ name: 'scrapingStatus', required: false, enum: ['pending', 'in_progress', 'completed', 'failed', 'scheduled'], description: 'Filter by scraping status' })
  @ApiQuery({ name: 'hasOnlinePrice', required: false, type: Boolean, description: 'Filter by online price availability' })
  @ApiQuery({ name: 'hasPhysicalPrice', required: false, type: Boolean, description: 'Filter by physical price availability' })
  @ApiQuery({ name: 'isOnSale', required: false, type: Boolean, description: 'Filter by sale status' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'currency', required: false, type: String, description: 'Filter by currency' })
  @ApiQuery({ name: 'minStock', required: false, type: Number, description: 'Minimum stock filter' })
  @ApiQuery({ name: 'maxStock', required: false, type: Number, description: 'Maximum stock filter' })
  @ApiQuery({ name: 'needsScraping', required: false, type: Boolean, description: 'Filter by scraping needs' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'createdAfter', required: false, type: String, description: 'Filter by creation date (ISO string)' })
  @ApiQuery({ name: 'createdBefore', required: false, type: String, description: 'Filter by creation date (ISO string)' })
  @ApiQuery({ name: 'lastScrapedAfter', required: false, type: String, description: 'Filter by last scraping date (ISO string)' })
  @ApiQuery({ name: 'lastScrapedBefore', required: false, type: String, description: 'Filter by last scraping date (ISO string)' })
  async getAllStoreProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('availability') availability?: string,
    @Query('scrapingStatus') scrapingStatus?: string,
    @Query('hasOnlinePrice') hasOnlinePrice?: string,
    @Query('hasPhysicalPrice') hasPhysicalPrice?: string,
    @Query('isOnSale') isOnSale?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('currency') currency?: string,
    @Query('minStock') minStock?: string,
    @Query('maxStock') maxStock?: string,
    @Query('needsScraping') needsScraping?: string,
    @Query('createdBy') createdBy?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
    @Query('lastScrapedAfter') lastScrapedAfter?: string,
    @Query('lastScrapedBefore') lastScrapedBefore?: string
  ): Promise<IStoreProductSearchResult> {
    const filter: IStoreProductFilter = {
      search,
      storeId,
      productId,
      status: status as any,
      availability: availability as any,
      scrapingStatus: scrapingStatus as any,
      hasOnlinePrice: hasOnlinePrice === 'true',
      hasPhysicalPrice: hasPhysicalPrice === 'true',
      isOnSale: isOnSale === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      currency,
      minStock: minStock ? parseInt(minStock) : undefined,
      maxStock: maxStock ? parseInt(maxStock) : undefined,
      needsScraping: needsScraping === 'true',
      createdBy,
      createdAfter: createdAfter ? new Date(createdAfter) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore) : undefined,
      lastScrapedAfter: lastScrapedAfter ? new Date(lastScrapedAfter) : undefined,
      lastScrapedBefore: lastScrapedBefore ? new Date(lastScrapedBefore) : undefined
    };

    return this.storeProductsService.getAllStoreProducts(req.user, filter, page, limit);
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get store products for admin management (with additional filters)' })
  @ApiResponse({ status: 200, description: 'Admin store products retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'out_of_stock', 'discontinued', 'coming_soon', 'error'], description: 'Filter by status' })
  @ApiQuery({ name: 'scrapingStatus', required: false, enum: ['pending', 'in_progress', 'completed', 'failed', 'scheduled'], description: 'Filter by scraping status' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by creator ID' })
  async getAdminStoreProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('scrapingStatus') scrapingStatus?: string,
    @Query('createdBy') createdBy?: string
  ): Promise<IStoreProductSearchResult> {
    const filter: IStoreProductFilter = {
      search,
      status: status as any,
      scrapingStatus: scrapingStatus as any,
      createdBy
    };

    return this.storeProductsService.getAllStoreProducts(req.user, filter, page, limit);
  }

  @Get('analytics')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get store product analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getStoreProductAnalytics(@Request() req: any): Promise<IStoreProductAnalytics> {
    return this.storeProductsService.getStoreProductAnalytics(req.user);
  }

  @Get('scraping/jobs')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get scraping jobs that need to be processed' })
  @ApiResponse({ status: 200, description: 'Scraping jobs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of jobs to return (default: 50)' })
  async getScrapingJobs(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
  ): Promise<IScrapingJob[]> {
    return this.storeProductsService.getScrapingJobs(req.user, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store product by ID' })
  @ApiResponse({ status: 200, description: 'Store product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  async getStoreProductById(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.getStoreProductById(id, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update store product by ID' })
  @ApiResponse({ status: 200, description: 'Store product updated successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiBody({ type: UpdateStoreProductDto })
  async updateStoreProduct(
    @Param('id') id: string,
    @Body() updateStoreProductDto: UpdateStoreProductDto,
    @Request() req: any
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.updateStoreProduct(id, updateStoreProductDto, req.user);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete store product by ID' })
  @ApiResponse({ status: 200, description: 'Store product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  async deleteStoreProduct(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    return this.storeProductsService.deleteStoreProduct(id, req.user);
  }

  @Put(':id/status')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Change store product status' })
  @ApiResponse({ status: 200, description: 'Store product status changed successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive', 'out_of_stock', 'discontinued', 'coming_soon', 'error'] } } } })
  async changeStoreProductStatus(
    @Param('id') id: string,
    @Body('status') status: StoreProductStatus,
    @Request() req: any
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.changeStoreProductStatus(id, status, req.user);
  }

  @Post('scraping/result')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Process scraping result for a store product' })
  @ApiResponse({ status: 200, description: 'Scraping result processed successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiBody({ type: ScrapingResultDto })
  async processScrapingResult(
    @Body() scrapingResult: ScrapingResultDto,
    @Request() req: any
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.processScrapingResult(scrapingResult, req.user);
  }

  @Post('scraping/start/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Start scraping for a specific store product' })
  @ApiResponse({ status: 200, description: 'Scraping started successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  async startScraping(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<{ message: string; storeProductId: string; status: ScrapingStatus }> {
    // This would typically trigger an external scraping service
    // For now, we'll just update the status
    const storeProduct = await this.storeProductsService.getStoreProductById(id, req.user);
    
    // In a real implementation, you would:
    // 1. Send the scraping job to a queue
    // 2. Update the scraping status to IN_PROGRESS
    // 3. Return a job ID or status
    
    return {
      message: 'Scraping job queued successfully',
      storeProductId: id,
      status: ScrapingStatus.SCHEDULED
    };
  }

  @Post('scraping/bulk-start')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Start scraping for multiple store products' })
  @ApiResponse({ status: 200, description: 'Bulk scraping started successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiBody({ schema: { type: 'object', properties: { storeProductIds: { type: 'array', items: { type: 'string' } } } } })
  async startBulkScraping(
    @Body('storeProductIds') storeProductIds: string[],
    @Request() req: any
  ): Promise<{ message: string; totalJobs: number; status: string }> {
    // This would typically trigger multiple scraping jobs
    // For now, we'll just return a success message
    
    return {
      message: 'Bulk scraping jobs queued successfully',
      totalJobs: storeProductIds.length,
      status: 'queued'
    };
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all products for a specific store' })
  @ApiResponse({ status: 200, description: 'Store products retrieved successfully' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  async getProductsByStore(
    @Param('storeId') storeId: string,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<IStoreProductSearchResult> {
    const filter: IStoreProductFilter = { storeId };
    return this.storeProductsService.getAllStoreProducts(req.user, filter, page, limit);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all stores that carry a specific product' })
  @ApiResponse({ status: 200, description: 'Store products retrieved successfully' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  async getStoresByProduct(
    @Param('productId') productId: string,
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<IStoreProductSearchResult> {
    const filter: IStoreProductFilter = { productId };
    return this.storeProductsService.getAllStoreProducts(req.user, filter, page, limit);
  }

  @Get('price-comparison/:productId')
  @ApiOperation({ summary: 'Compare prices for a product across different stores' })
  @ApiResponse({ status: 200, description: 'Price comparison retrieved successfully' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'currency', required: false, type: String, description: 'Currency for price comparison (default: USD)' })
  async getPriceComparison(
    @Param('productId') productId: string,
    @Query('currency') currency: string = 'USD',
    @Request() req: any
  ): Promise<{
    productId: string;
    productName: string;
    currency: string;
    stores: Array<{
      storeId: string;
      storeName: string;
      onlinePrice?: number;
      physicalPrice?: number;
      bestPrice: number;
      availability: Availability;
      lastUpdated: Date;
    }>;
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
  }> {
    // This would typically aggregate price data from multiple stores
    // For now, we'll return a placeholder structure
    
    const filter: IStoreProductFilter = { productId, currency };
    const result = await this.storeProductsService.getAllStoreProducts(req.user, filter, 1, 100);
    
    if (result.storeProducts.length === 0) {
      throw new NotFoundException(`No store products found for product ID '${productId}'`);
    }

    const stores = result.storeProducts.map(sp => ({
      storeId: sp.storeId,
      storeName: sp.storeName,
      onlinePrice: sp.onlinePrice,
      physicalPrice: sp.physicalPrice,
      bestPrice: sp.onlinePrice && sp.physicalPrice ? Math.min(sp.onlinePrice, sp.physicalPrice) : (sp.onlinePrice || sp.physicalPrice || 0),
      availability: sp.availability,
      lastUpdated: sp.lastScraped
    }));

    const prices = stores.map(s => s.bestPrice).filter(p => p > 0);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      average: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
    };

    return {
      productId,
      productName: result.storeProducts[0].productName,
      currency,
      stores,
      priceRange
    };
  }
}
