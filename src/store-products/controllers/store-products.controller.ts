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
import {
  CreateStoreProductDto,
} from '../dto';
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
        regularField: 'test value'
      }
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
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
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
  async getAllStoreProducts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('createdBy') createdBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{ data: IStoreProductResponse[]; total: number; page: number; limit: number }> {
    const filter: IStoreProductFilter = {
      search,
      createdBy,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    return this.storeProductsService.getAllStoreProducts(req.user, filter, page, limit);
  }

  @Get('admin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get all store products for admin' })
  @ApiResponse({
    status: 200,
    description: 'Store products retrieved successfully',
  })
  async getAdminStoreProducts(
    @Request() req: any,
  ): Promise<{ data: IStoreProductResponse[]; total: number; page: number; limit: number }> {
    return this.storeProductsService.getAllStoreProducts(req.user, {}, 1, 100);
  }

  @Get('check-url-exists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Check if URL exists in database',
    description: 'Verifies if a URL already exists in the database associated with a product. Returns true if exists, false otherwise.',
  })
  @ApiQuery({
    name: 'url',
    description: 'URL to check in database',
    example: 'https://www.example.com/product/123',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'URL check completed successfully',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', description: 'Whether the URL exists in database' },
        url: { type: 'string', description: 'The URL that was checked' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async checkUrlExists(@Query('url') url: string): Promise<{
    exists: boolean;
    url: string;
  }> {
    try {
      if (!url) {
        throw new HttpException(
          'URL parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const exists = await this.storeProductsService.checkUrlExists(url);

      return {
        exists,
        url,
      };
    } catch (error) {
      this.logger.error(
        `URL check error for ${url}: ${error.message}`,
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
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiBody({ type: CreateStoreProductDto })
  async updateStoreProduct(
    @Param('id') id: string,
    @Body() updateStoreProductDto: Partial<CreateStoreProductDto>,
    @Request() req: any,
  ): Promise<IStoreProductResponse> {
    return this.storeProductsService.updateStoreProduct(
      id,
      updateStoreProductDto,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete store product' })
  @ApiResponse({ status: 200, description: 'Store product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store product not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
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
  @ApiOperation({ summary: 'Add scraped products' })
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
    this.logger.log('Request data received:', JSON.stringify(data, null, 2));
    this.logger.log('User making request:', JSON.stringify(req.user, null, 2));
    this.logger.log('Data type:', typeof data);
    this.logger.log('Data is array:', Array.isArray(data));
    
    try {
      // Process received data
      if (Array.isArray(data)) {
        this.logger.log(`Processing ${data.length} products`);
        
        const results: Array<{
          success: boolean;
          originalId: any;
          createdProduct?: any;
          error?: string;
          errorDetails?: any;
        }> = [];
        
        for (let i = 0; i < data.length; i++) {
          const product = data[i];
          this.logger.log(`Processing product ${i + 1}:`, JSON.stringify(product, null, 2));
          
          try {
            // Map scraping data to expected format
            const createStoreProductDto = {
              name: product.name || 'Unnamed Product',
              description: product.description || null,
              url: product.url || null,
              sku: product.sku || null,
              storeProductId: product.id || null, // External store product ID
              image: product.imageUrl || product.image || null,
              price: product.price ? Math.round(parseFloat(product.price.toString().replace(/[^0-9.-]/g, ''))) : undefined,
              metadata: {
                brand: product.brand || null,
                rating: product.rating || null,
                ratingText: product.ratingText || null,
                ppum: product.ppum || null,
                highResImageUrl: product.highResImageUrl || null,
                categories: product.categories || [],
                originalPrice: product.price || null, // Save original scraping price
                originalData: product
              },
              notes: `Product added from scraping - ${new Date().toISOString()}`
            };
            
            this.logger.log(`Mapped DTO for product ${i + 1}:`, JSON.stringify(createStoreProductDto, null, 2));
            
            // Check if product already exists with same storeProductId or url
            const existingProduct = await this.storeProductsService.checkDuplicateStoreProduct(
              createStoreProductDto.storeProductId,
              createStoreProductDto.url
            );
            
            if (existingProduct) {
              this.logger.log(`Product ${i + 1} already exists - skipping. Existing ID: ${existingProduct.id}`);
              
              results.push({
                success: false,
                originalId: product.id,
                error: 'Product already exists',
                errorDetails: {
                  reason: 'duplicate',
                  existingProductId: existingProduct.id,
                  duplicateBy: existingProduct.storeProductId === createStoreProductDto.storeProductId ? 'storeProductId' : 'url',
                  duplicateValue: existingProduct.storeProductId === createStoreProductDto.storeProductId ? createStoreProductDto.storeProductId : createStoreProductDto.url
                }
              });
              continue; // Skip to next product
            }
            
            // Extract categories from original metadata
            const categoryNames = product.categories || [];
            
            // Extract store information
            const storeName = product.storeName || product.store || product.source || 'Unknown Store';
            const storeWebsite = product.storeWebsite || product.storeUrl || null;
            
            this.logger.log(`Store info for product ${i + 1}:`, { storeName, storeWebsite });
            
            const createdProduct = await this.storeProductsService.createStoreProduct(
              createStoreProductDto,
              req.user,
              categoryNames,
              storeName,
              storeWebsite
            );
            
            results.push({
              success: true,
              originalId: product.id,
              createdProduct: createdProduct
            });
            
            this.logger.log(`Successfully created product ${i + 1} with ID: ${createdProduct.id}`);
            
          } catch (productError) {
            this.logger.error(`Error processing product ${i + 1}:`, productError);
            this.logger.error(`Error message: ${productError.message}`);
            this.logger.error(`Error stack: ${productError.stack}`);
            
            results.push({
              success: false,
              originalId: product.id,
              error: productError.message,
              errorDetails: {
                message: productError.message,
                stack: productError.stack,
                name: productError.name
              }
            });
          }
        }
        
        this.logger.log('Final results:', JSON.stringify(results, null, 2));
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const duplicates = results.filter(r => !r.success && r.errorDetails?.reason === 'duplicate').length;
        const errors = results.filter(r => !r.success && r.errorDetails?.reason !== 'duplicate').length;

        const response = {
          message: 'Scraped products processed',
          total: data.length,
          successful: successful,
          failed: failed,
          duplicates: duplicates,
          errors: errors,
          results: results,
          logs: {
            endpoint: 'store-products/scraping/add-products',
            timestamp: new Date().toISOString(),
            user: req.user?.username || 'unknown'
          }
        };
        
        return response;
        
      } else {
        const errorMsg = `Data is not an array: ${typeof data}`;
        this.logger.error('Data is not an array:', typeof data);
        
        return {
          error: 'Data must be an array of products',
          received: typeof data,
          message: errorMsg,
          logs: {
            endpoint: 'store-products/scraping/add-products',
            timestamp: new Date().toISOString(),
            user: req.user?.username || 'unknown'
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in addScrapedProducts:', error);
      this.logger.error('Error stack:', error.stack);
      
      return {
        error: 'Critical error processing request',
        message: error.message,
        details: {
          name: error.name,
          stack: error.stack
        },
        logs: {
          endpoint: 'store-products/scraping/add-products',
          timestamp: new Date().toISOString(),
          user: req.user?.username || 'unknown'
        }
      };
    }
  }

}

