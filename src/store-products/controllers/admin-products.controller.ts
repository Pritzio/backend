import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { ProductMatchingService } from '../services/product-matching.service';
import { StoreProductsService } from '../services/store-products.service';
import { BaseProduct } from '../entities/base-product.entity';
import { StoreProduct } from '../entities/store-product.entity';

@ApiTags('Admin Products Management')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(
    private readonly _productMatchingService: ProductMatchingService,
    private readonly _storeProductsService: StoreProductsService,
  ) {}

  @Get('duplicates')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ 
    summary: 'Get duplicate product groups with advanced filtering',
    description: 'Find products that are likely duplicates based on similarity analysis'
  })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Similarity threshold (0-1), default: 0.9' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of groups to return, default: 50' })
  @ApiQuery({ name: 'brand', required: false, type: String, description: 'Filter by brand name' })
  @ApiResponse({
    status: 200,
    description: 'Duplicate groups found successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          avgSimilarity: { type: 'number' },
          threshold: { type: 'number' },
          count: { type: 'number' },
          brand: { type: 'string' },
          suggestedMerge: { type: 'object' },
          totalStores: { type: 'number' },
          totalVariants: { type: 'number' },
          products: { type: 'array' },
          mergeRecommendation: { type: 'string' }
        }
      }
    }
  })
  async getDuplicateGroups(
    @Query('threshold') threshold?: number,
    @Query('limit') limit?: number,
    @Query('brand') brand?: string,
  ) {
    return await this._productMatchingService.findDuplicateGroups({
      threshold: threshold || 0.9,
      limit: limit || 50,
      brand: brand
    });
  }

  @Post('merge')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge duplicate products into one base product' })
  @ApiResponse({
    status: 200,
    description: 'Products merged successfully',
  })
  async mergeProducts(@Body() mergeRequest: {
    baseProductId: string;
    duplicateProductIds: string[];
  }) {
    return await this._productMatchingService.mergeProducts(
      mergeRequest.baseProductId,
      mergeRequest.duplicateProductIds,
    );
  }

  @Post('associate-store-product')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Associate a store product to a base product' })
  @ApiResponse({
    status: 200,
    description: 'Store product associated successfully',
  })
  async associateStoreProduct(@Body() associationRequest: {
    storeProductId: string;
    baseProductId: string;
  }) {
    return await this._productMatchingService.associateStoreProduct(
      associationRequest.storeProductId,
      associationRequest.baseProductId,
    );
  }

  @Post('disassociate-store-product')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disassociate a store product from its base product' })
  @ApiResponse({
    status: 200,
    description: 'Store product disassociated successfully',
  })
  async disassociateStoreProduct(@Body() disassociationRequest: {
    storeProductId: string;
  }) {
    return await this._productMatchingService.disassociateStoreProduct(
      disassociationRequest.storeProductId,
    );
  }

  @Delete('base-product/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a base product (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Base product deleted successfully',
  })
  async deleteBaseProduct(@Param('id') id: string) {
    return await this._productMatchingService.deleteBaseProduct(id);
  }

  @Delete('base-product/:id/hard')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete a base product and disassociate all store products' })
  @ApiResponse({
    status: 200,
    description: 'Base product hard deleted successfully',
  })
  async hardDeleteBaseProduct(@Param('id') id: string) {
    return await this._productMatchingService.hardDeleteBaseProduct(id);
  }

  @Get('store-products/unassociated')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get store products that are not associated with any base product' })
  @ApiResponse({
    status: 200,
    description: 'Unassociated store products found successfully',
  })
  async getUnassociatedStoreProducts(@Query('storeId') storeId?: string) {
    return await this._storeProductsService.getUnassociatedStoreProducts(storeId);
  }

  @Get('store-products/unassociated-with-suggestions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({ summary: 'Get unassociated store products with base product suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Unassociated store products with suggestions found successfully',
  })
  async getUnassociatedStoreProductsWithSuggestions(
    @Query('storeId') storeId?: string,
    @Query('threshold') threshold: number = 0.7
  ) {
    const unassociatedProducts = await this._storeProductsService.getUnassociatedStoreProducts(storeId);
    
    // Add suggestions for each unassociated product
    const productsWithSuggestions = await Promise.all(
      unassociatedProducts.data.map(async (product) => {
        try {
          const suggestions = await this._productMatchingService.suggestAssociations(
            product.id,
            threshold
          );
          return {
            ...product,
            suggestions: suggestions.suggestions
          };
        } catch (error) {
          return {
            ...product,
            suggestions: []
          };
        }
      })
    );

    return {
      data: productsWithSuggestions,
      total: unassociatedProducts.total
    };
  }

  @Get('base-products')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get all base products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Base products found successfully',
  })
  async getBaseProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('brand') brand?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return await this._productMatchingService.getBaseProducts({
      page,
      limit,
      search,
      brand,
      isActive,
    });
  }

  @Get('base-product/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get a base product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Base product found successfully',
  })
  async getBaseProduct(@Param('id') id: string) {
    return await this._productMatchingService.getBaseProductById(id);
  }

  @Post('base-product')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new base product' })
  @ApiResponse({
    status: 201,
    description: 'Base product created successfully',
  })
  async createBaseProduct(@Body() createData: {
    name: string;
    brand?: string;
    model?: string;
    sku?: string;
    specifications?: Record<string, any>;
    isActive?: boolean;
  }) {
    return await this._productMatchingService.createBaseProduct(createData);
  }

  @Put('base-product/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update a base product' })
  @ApiResponse({
    status: 200,
    description: 'Base product updated successfully',
  })
  async updateBaseProduct(
    @Param('id') id: string,
    @Body() updateData: Partial<BaseProduct>,
  ) {
    return await this._productMatchingService.updateBaseProduct(id, updateData);
  }

  @Post('suggest-associations')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get suggested associations for a store product' })
  @ApiResponse({
    status: 200,
    description: 'Suggested associations found successfully',
  })
  async suggestAssociations(@Body() request: {
    storeProductId: string;
    threshold?: number;
  }) {
    return await this._productMatchingService.suggestAssociations(
      request.storeProductId,
      request.threshold || 0.7,
    );
  }
}
