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
  IStoreProductSummary,
  IStoreProductFilter,
} from '../interfaces/store-product.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';

import { NotFoundException } from '@nestjs/common';

@ApiTags('Store Products')
@Controller('store-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoreProductsController {
  private readonly logger = new Logger(StoreProductsController.name);

  constructor(
    private readonly storeProductsService: StoreProductsService,
  ) {}

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
    console.log('🔥🔥🔥 SCRAPING ENDPOINT CALLED - DATA RECEIVED 🔥🔥🔥');
    console.log('📊 REQUEST DATA:', JSON.stringify(data, null, 2));
    console.log('👤 USER INFO:', JSON.stringify(req.user, null, 2));
    
    this.logger.log('=== SCRAPING ADD PRODUCTS ENDPOINT CALLED ===');
    this.logger.log('Request data received:', JSON.stringify(data, null, 2));
    this.logger.log('User making request:', JSON.stringify(req.user, null, 2));
    this.logger.log('Data type:', typeof data);
    this.logger.log('Data is array:', Array.isArray(data));
    
    try {
      // Procesar los datos recibidos
      if (Array.isArray(data)) {
        console.log(`🔄 Processing ${data.length} products`);
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
          console.log(`📦 Processing product ${i + 1}:`, JSON.stringify(product, null, 2));
          this.logger.log(`Processing product ${i + 1}:`, JSON.stringify(product, null, 2));
          
          try {
            // Mapear los datos del scraping al formato esperado
            const createStoreProductDto = {
              name: product.name || 'Producto sin nombre',
              description: product.description || null,
              url: product.url || null,
              sku: product.sku || null,
              storeProductId: product.id || null, // ID del producto en la tienda externa
              image: product.imageUrl || product.image || null,
              metadata: {
                brand: product.brand || null,
                rating: product.rating || null,
                ratingText: product.ratingText || null,
                ppum: product.ppum || null,
                highResImageUrl: product.highResImageUrl || null,
                categories: product.categories || [],
                originalPrice: product.price || null, // Guardar el precio original del scraping
                originalData: product
              },
              notes: `Producto agregado desde scraping - ${new Date().toISOString()}`
            };
            
            console.log(`✅ Mapped DTO for product ${i + 1}:`, JSON.stringify(createStoreProductDto, null, 2));
            this.logger.log(`Mapped DTO for product ${i + 1}:`, JSON.stringify(createStoreProductDto, null, 2));
            
            // Verificar si ya existe un producto con el mismo storeProductId o url
            const existingProduct = await this.storeProductsService.checkDuplicateStoreProduct(
              createStoreProductDto.storeProductId,
              createStoreProductDto.url
            );
            
            if (existingProduct) {
              console.log(`⚠️ Product ${i + 1} already exists - skipping. Existing ID: ${existingProduct.id}, storeProductId: ${existingProduct.storeProductId}, url: ${existingProduct.url}`);
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
              continue; // Pasar al siguiente producto
            }
            
            // Extraer categorías del metadata original
            const categoryNames = product.categories || [];
            
            const createdProduct = await this.storeProductsService.createStoreProduct(
              createStoreProductDto,
              req.user,
              categoryNames
            );
            
            results.push({
              success: true,
              originalId: product.id,
              createdProduct: createdProduct
            });
            
            console.log(`🎉 Successfully created product ${i + 1} with ID: ${createdProduct.id}`);
            this.logger.log(`Successfully created product ${i + 1} with ID: ${createdProduct.id}`);
            
          } catch (productError) {
            console.error(`❌ Error processing product ${i + 1}:`, productError);
            console.error(`❌ Error message:`, productError.message);
            console.error(`❌ Error stack:`, productError.stack);
            
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
        
        console.log('📋 Final results:', JSON.stringify(results, null, 2));
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
        
        console.log('📤 Sending response:', JSON.stringify(response, null, 2));
        return response;
        
      } else {
        const errorMsg = `Data is not an array: ${typeof data}`;
        console.error('❌', errorMsg);
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
      console.error('💥 CRITICAL ERROR in addScrapedProducts:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
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