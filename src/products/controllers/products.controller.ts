import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  BulkCreateProductsDto,
  BulkCreateProductsResponseDto,
} from '../dto';
import {
  IProductResponse,
  IProductSummary,
  IProductFilter,
  IProductAnalytics,
  IProductSearchResult,
  IProductBulkOperation,
  IProductBulkOperationInput,
} from '../interfaces/product.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { ProductStatus } from '../entities/product.entity';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Product code already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({ type: CreateProductDto })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.createProduct(createProductDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name, description, or code',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'subcategory',
    required: false,
    type: String,
    description: 'Filter by subcategory',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    type: String,
    description: 'Filter by brand',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['physical', 'digital', 'service', 'subscription'],
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock', 'coming_soon'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['new', 'used', 'refurbished', 'open_box'],
    description: 'Filter by condition',
  })
  @ApiQuery({
    name: 'hasWarranty',
    required: false,
    type: Boolean,
    description: 'Filter by warranty availability',
  })
  @ApiQuery({
    name: 'hasDimensions',
    required: false,
    type: Boolean,
    description: 'Filter by dimensions availability',
  })
  @ApiQuery({
    name: 'hasWeight',
    required: false,
    type: Boolean,
    description: 'Filter by weight availability',
  })
  @ApiQuery({
    name: 'minWeight',
    required: false,
    type: Number,
    description: 'Minimum weight filter',
  })
  @ApiQuery({
    name: 'maxWeight',
    required: false,
    type: Number,
    description: 'Maximum weight filter',
  })
  @ApiQuery({
    name: 'minWarranty',
    required: false,
    type: Number,
    description: 'Minimum warranty months',
  })
  @ApiQuery({
    name: 'maxWarranty',
    required: false,
    type: Number,
    description: 'Maximum warranty months',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Comma-separated tags to filter by',
  })
  @ApiQuery({
    name: 'features',
    required: false,
    type: String,
    description: 'Comma-separated features to filter by',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator ID',
  })
  @ApiQuery({
    name: 'createdAfter',
    required: false,
    type: String,
    description: 'Filter by creation date (ISO string)',
  })
  @ApiQuery({
    name: 'createdBefore',
    required: false,
    type: String,
    description: 'Filter by creation date (ISO string)',
  })
  async getAllProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('brand') brand?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
    @Query('hasWarranty') hasWarranty?: string,
    @Query('hasDimensions') hasDimensions?: string,
    @Query('hasWeight') hasWeight?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('minWarranty') minWarranty?: string,
    @Query('maxWarranty') maxWarranty?: string,
    @Query('tags') tags?: string,
    @Query('features') features?: string,
    @Query('createdBy') createdBy?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
  ): Promise<IProductSearchResult> {
    const filter: IProductFilter = {
      search,
      category,
      subcategory,
      brand,
      type: type as any,
      status: status as any,
      condition: condition as any,
      hasWarranty: hasWarranty === 'true',
      hasDimensions: hasDimensions === 'true',
      hasWeight: hasWeight === 'true',
      minWeight: minWeight ? parseFloat(minWeight) : undefined,
      maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
      minWarranty: minWarranty ? parseInt(minWarranty) : undefined,
      maxWarranty: maxWarranty ? parseInt(maxWarranty) : undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
      features: features ? features.split(',').map((f) => f.trim()) : undefined,
      createdBy,
      createdAfter: createdAfter ? new Date(createdAfter) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore) : undefined,
    };

    return this.productsService.getAllProducts(req.user, filter, page, limit);
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get products for admin management (with additional filters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin products retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock', 'coming_soon'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator ID',
  })
  async getAdminProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('createdBy') createdBy?: string,
  ): Promise<IProductSearchResult> {
    const filter: IProductFilter = {
      search,
      status: status as any,
      createdBy,
    };

    return this.productsService.getAllProducts(req.user, filter, page, limit);
  }

  @Get('analytics')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get product analytics and statistics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getProductAnalytics(@Request() req: any): Promise<IProductAnalytics> {
    return this.productsService.getProductAnalytics(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async getProductById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.getProductById(id, req.user);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get product by code' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'code', description: 'Product code' })
  async getProductByCode(
    @Param('code') code: string,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.getProductByCode(code, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Product code already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.updateProduct(id, updateProductDto, req.user);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async deleteProduct(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.productsService.deleteProduct(id, req.user);
  }

  @Put(':id/status')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Change product status' })
  @ApiResponse({
    status: 200,
    description: 'Product status changed successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'active',
            'inactive',
            'discontinued',
            'out_of_stock',
            'coming_soon',
          ],
        },
      },
    },
  })
  async changeProductStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.changeProductStatus(id, status, req.user);
  }

  @Post('bulk/activate')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Activate multiple products' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { productIds: { type: 'array', items: { type: 'string' } } },
    },
  })
  async bulkActivateProducts(
    @Body('productIds') productIds: string[],
    @Request() req: any,
  ): Promise<IProductBulkOperation> {
    const operation: IProductBulkOperationInput = {
      productIds,
      operation: 'activate',
    };
    return this.productsService.bulkUpdateProducts(operation, req.user);
  }

  @Post('bulk/deactivate')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Deactivate multiple products' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { productIds: { type: 'array', items: { type: 'string' } } },
    },
  })
  async bulkDeactivateProducts(
    @Body('productIds') productIds: string[],
    @Request() req: any,
  ): Promise<IProductBulkOperation> {
    const operation: IProductBulkOperationInput = {
      productIds,
      operation: 'deactivate',
    };
    return this.productsService.bulkUpdateProducts(operation, req.user);
  }

  @Post('bulk/discontinue')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Discontinue multiple products' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { productIds: { type: 'array', items: { type: 'string' } } },
    },
  })
  async bulkDiscontinueProducts(
    @Body('productIds') productIds: string[],
    @Request() req: any,
  ): Promise<IProductBulkOperation> {
    const operation: IProductBulkOperationInput = {
      productIds,
      operation: 'discontinue',
    };
    return this.productsService.bulkUpdateProducts(operation, req.user);
  }

  @Post('bulk/delete')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete multiple products' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { productIds: { type: 'array', items: { type: 'string' } } },
    },
  })
  async bulkDeleteProducts(
    @Body('productIds') productIds: string[],
    @Request() req: any,
  ): Promise<IProductBulkOperation> {
    const operation: IProductBulkOperationInput = {
      productIds,
      operation: 'delete',
    };
    return this.productsService.bulkUpdateProducts(operation, req.user);
  }

  @Post('bulk/update')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update multiple products' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productIds: { type: 'array', items: { type: 'string' } },
        data: { type: 'object' },
      },
    },
  })
  async bulkUpdateProducts(
    @Body('productIds') productIds: string[],
    @Body('data') data: Partial<IProductResponse>,
    @Request() req: any,
  ): Promise<IProductBulkOperation> {
    const operation: IProductBulkOperationInput = {
      productIds,
      operation: 'update',
      data,
    };
    return this.productsService.bulkUpdateProducts(operation, req.user);
  }

  @Post('bulk/create')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Create multiple products at once',
    description:
      'Create multiple products in a single request. Ideal for automated scraping and bulk imports.',
  })
  @ApiResponse({
    status: 201,
    description: 'Products created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            created: { type: 'number' },
            failed: { type: 'number' },
            total: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  product: { type: 'object' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid product data or validation errors',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateProductDto' },
          description: 'Array of products to create',
          minItems: 1,
          maxItems: 100,
        },
        options: {
          type: 'object',
          properties: {
            skipDuplicates: {
              type: 'boolean',
              default: true,
              description:
                'Skip products with duplicate codes instead of failing',
            },
            validateOnly: {
              type: 'boolean',
              default: false,
              description: 'Only validate products without creating them',
            },
          },
        },
      },
      required: ['products'],
    },
  })
  async bulkCreateProducts(
    @Body() bulkCreateDto: BulkCreateProductsDto,
    @Request() req: any,
  ): Promise<BulkCreateProductsResponseDto> {
    return this.productsService.bulkCreateProducts(
      bulkCreateDto.products,
      bulkCreateDto.options || {},
      req.user,
    );
  }

  @Get('scraping/ready')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get products ready for scraping',
    description:
      'Get products that need price updates or are suitable for scraping operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Products ready for scraping retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              code: { type: 'string' },
              brand: { type: 'string' },
              category: { type: 'string' },
              lastScraped: { type: 'string', nullable: true },
              scrapingPriority: { type: 'string' },
              scrapingMetadata: { type: 'object' },
            },
          },
        },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of products to return (default: 50)',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['high', 'medium', 'low', 'all'],
    description: 'Filter by scraping priority',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by product category',
  })
  @ApiQuery({
    name: 'lastScrapedBefore',
    required: false,
    type: String,
    description: 'Get products not scraped since this date (ISO string)',
  })
  async getProductsForScraping(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('lastScrapedBefore') lastScrapedBefore?: string,
  ): Promise<any> {
    return this.productsService.getProductsForScraping(req.user, {
      limit,
      priority,
      category,
      lastScrapedBefore,
    });
  }

  @Post('scraping/update')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Update scraping metadata for products',
    description:
      'Update scraping information and metadata for products after scraping operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Scraping metadata updated successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        scrapingData: {
          type: 'object',
          properties: {
            lastScraped: { type: 'string' },
            scrapingSource: { type: 'string' },
            scrapingStatus: { type: 'string' },
            scrapingMetadata: { type: 'object' },
            scrapingErrors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['productId', 'scrapingData'],
    },
  })
  async updateScrapingMetadata(
    @Body('productId') productId: string,
    @Body('scrapingData') scrapingData: any,
    @Request() req: any,
  ): Promise<IProductResponse> {
    return this.productsService.updateScrapingMetadata(
      productId,
      scrapingData,
      req.user,
    );
  }
}
