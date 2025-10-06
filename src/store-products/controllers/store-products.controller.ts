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
  Logger,
  UseInterceptors,
  HttpException,
  HttpStatus,
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
import { StoreProductsService } from '../services/store-products.service';
import { ProductMatchingService } from '../services/product-matching.service';
import { CreateStoreProductDto } from '../dto';
import {
  IStoreProductResponse,
  IStoreProductFilter,
} from '../interfaces/store-product.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { DateFormatterUtil } from '../../common/utils/date-formatter.util';

@ApiTags('Store Products')
@Controller('store-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoreProductsController {
  private readonly logger = new Logger(StoreProductsController.name);

  constructor(
    private readonly storeProductsService: StoreProductsService,
    private readonly productMatchingService: ProductMatchingService,
  ) {}

  @Get('test-dates')
  @ApiOperation({ summary: 'Test date formatting' })
  @ApiResponse({ status: 200, description: 'Test dates returned' })
  async testDates() {
    const testData = {
      currentDate: new Date(),
      chileTime: DateFormatterUtil.getCurrentChileTime(),
      formattedDate: DateFormatterUtil.formatToChileanDateTime(new Date()),
      testObject: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastScraped: new Date(),
        regularField: 'test value',
      },
    };

    return testData;
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Create a new store product' })
  @ApiResponse({
    status: 201,
    description: 'Store product created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({ type: CreateStoreProductDto })
  async createStoreProduct(
    @Body() createStoreProductDto: CreateStoreProductDto,
    @Request() req: any,
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.createStoreProduct(
      createStoreProductDto,
      req.user,
    );
  }

  @Get()
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.ADMIN,
    RoleType.STORE_ADMIN,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get all store products with filters' })
  @ApiResponse({
    status: 200,
    description: 'Store products retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'createdBy', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  async getAllStoreProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('createdBy') createdBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('storeId') storeId?: string,
  ): Promise<{
    data: IStoreProductResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: IStoreProductFilter = {
      search,
      createdBy,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      storeId,
    };

    return this.storeProductsService.getAllStoreProducts(
      req.user,
      filter,
      page,
      limit,
    );
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get all store products for admin' })
  @ApiResponse({
    status: 200,
    description: 'Store products retrieved successfully',
  })
  async getAdminStoreProducts(@Request() req: any): Promise<{
    data: IStoreProductResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.storeProductsService.getAllStoreProducts(req.user, {}, 1, 100);
  }

  @Post('check-url-exists')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Check if URL exists in database',
    description:
      'Verifies if a URL already exists in the database. Returns the same data sent plus existence status.',
  })
  @ApiBody({
    description:
      'Any data with URL to check existence. Only URL is required, rest can be any structure.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to check in database (REQUIRED)',
          example: 'https://www.example.com/product/123',
        },
        // Any other properties are allowed
      },
      required: ['url'],
      additionalProperties: true,
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'URL check completed successfully. Returns the same data sent plus exists status.',
    schema: {
      type: 'object',
      properties: {
        exists: {
          type: 'boolean',
          description: 'Whether the URL exists in database',
        },
        url: { type: 'string', description: 'The URL that was checked' },
        // All other properties from the original request will be included
      },
      additionalProperties: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async checkUrlExists(@Body() data: any): Promise<any> {
    this.logger.log('=== CHECK URL EXISTS CALLED ===');
    this.logger.log('Received data:', JSON.stringify(data, null, 2));

    try {
      if (!data || !data.url) {
        this.logger.error('URL is missing from request body');
        throw new HttpException(
          'URL is required in request body',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Checking URL existence for: ${data.url}`);
      const exists = await this.storeProductsService.checkUrlExists(data.url);
      this.logger.log(`URL exists: ${exists}`);

      const response = {
        exists,
        ...data, // Esto incluye todos los campos que enviaste
      };

      this.logger.log('Returning response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      this.logger.error(
        `URL check error for ${data?.url || 'unknown'}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'An unexpected error occurred during URL check',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.ADMIN,
    RoleType.STORE_ADMIN,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get store product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Store product retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  async getStoreProductById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.getStoreProductById(id, req.user);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Update store product' })
  @ApiResponse({
    status: 200,
    description: 'Store product updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiBody({ type: CreateStoreProductDto })
  async updateStoreProduct(
    @Param('id') id: string,
    @Body() updateStoreProductDto: CreateStoreProductDto,
    @Request() req: any,
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.updateStoreProduct(
      id,
      updateStoreProductDto,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Delete store product' })
  @ApiResponse({
    status: 200,
    description: 'Store product deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  async deleteStoreProduct(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.storeProductsService.deleteStoreProduct(id, req.user);
    return { message: 'Store product deleted successfully' };
  }

  @Post('scraping/add-products')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Add scraped products with automatic matching' })
  @ApiResponse({
    status: 201,
    description: 'Scraped products added successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async addScrapedProducts(
    @Body() data: any,
    @Request() req: any,
  ): Promise<any> {
    this.logger.log('=== SCRAPING ADD PRODUCTS ENDPOINT CALLED ===');
    this.logger.log(
      `Processing ${Array.isArray(data) ? data.length : 0} products with automatic matching`,
    );

    try {
      if (Array.isArray(data)) {
        // Prepare data for batch matching
        const productsForMatching = data.map((product) => ({
          name: product.name || 'Unnamed Product',
          brand: product.brand || product.metadata?.brand,
          specifications: {
            categories: product.categories || [],
            rating: product.rating,
            originalData: product,
          },
          storeId: product.storeId || product.store?.id || null,
        }));

        // Process batch matching
        const matchingResults =
          await this.productMatchingService.processBatchProducts(
            productsForMatching,
          );

        const results: Array<{
          success: boolean;
          originalId: any;
          createdProduct?: any;
          error?: string;
          matchedBaseProduct?: any;
        }> = [];

        for (let i = 0; i < data.length; i++) {
          const product = data[i];

          try {
            // Get corresponding base product
            const productKey = product.name || 'Unnamed Product';
            const baseProduct = matchingResults.get(productKey);

            if (!baseProduct) {
              throw new Error('Failed to match or create base product');
            }

            // Create DTO with base product association
            const createStoreProductDto = {
              name: product.name || 'Unnamed Product',
              description: product.description || null,
              url: product.url || null,
              sku: product.sku || null,
              storeProductId:
                product.id &&
                typeof product.id === 'string' &&
                product.id.length >= 3
                  ? product.id
                  : `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              image: product.imageUrl || product.image || null,
              price: product.price
                ? Math.round(
                    parseFloat(
                      product.price.toString().replace(/[^0-9.-]/g, ''),
                    ),
                  )
                : undefined,
              metadata: {
                brand: product.brand || null,
                rating: product.rating || null,
                ratingText: product.ratingText || null,
                ppum: product.ppum || null,
                highResImageUrl: product.highResImageUrl || null,
                categories: product.categories || [],
                originalPrice: product.price || null,
                originalData: product,
                matchedBaseProduct: {
                  id: baseProduct.id,
                  name: baseProduct.name,
                  brand: baseProduct.brand,
                  similarity: 'auto-matched',
                },
              },
              notes: `Product added from scraping with auto-matching - ${new Date().toISOString()}`,
            };

            // Check for duplicates
            const existingProduct =
              await this.storeProductsService.checkDuplicateStoreProduct(
                createStoreProductDto.storeProductId,
                createStoreProductDto.url,
              );

            if (existingProduct) {
              results.push({
                success: false,
                originalId: product.id,
                error: 'Product already exists',
                matchedBaseProduct: baseProduct,
              });
              continue;
            }

            // Create product with automatic association
            const createdProduct =
              await this.storeProductsService.createStoreProductWithBase(
                createStoreProductDto,
                req.user,
                baseProduct.id,
                product.categories || [],
                product.storeName ||
                  product.store ||
                  product.source ||
                  'Unknown Store',
                product.storeWebsite || product.storeUrl || null,
              );

            results.push({
              success: true,
              originalId: product.id,
              createdProduct: createdProduct,
              matchedBaseProduct: baseProduct,
            });
          } catch (productError) {
            this.logger.error(
              `Error processing product ${i + 1}:`,
              productError,
            );

            results.push({
              success: false,
              originalId: product.id,
              error: productError.message,
            });
          }
        }

        // Final statistics
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const matched = results.filter((r) => r.matchedBaseProduct).length;
        const newBaseProducts = new Set(
          results.map((r) => r.matchedBaseProduct?.id).filter(Boolean),
        ).size;

        return {
          message: `Scraping completed. ${successful} products added successfully, ${failed} failed. ${matched} products matched to base products, ${newBaseProducts} new base products created.`,
          results,
          statistics: {
            total: data.length,
            successful,
            failed,
            matched,
            newBaseProducts,
            successRate: Math.round((successful / data.length) * 100),
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Request body must be an array of products');
      }
    } catch (error) {
      this.logger.error('Scraping add products error:', error);
      throw new HttpException(
        `Scraping failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
