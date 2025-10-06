import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductMatchingService } from '../services/product-matching.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { PermissionType } from '../../auth/entities/permission.entity';

@ApiTags('Product Comparison')
@Controller('product-comparison')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductComparisonController {
  private readonly _logger = new Logger(ProductComparisonController.name);

  constructor(
    private readonly _productMatchingService: ProductMatchingService,
  ) {}

  @Get('search')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.ADMIN,
    RoleType.STORE_ADMIN,
    RoleType.CUSTOMER,
  )
  @Permissions(PermissionType.PRODUCT_READ, PermissionType.PRICE_READ)
  @ApiOperation({ summary: 'Search products for comparison' })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    example: 'nova papel 70m',
  })
  @ApiResponse({
    status: 200,
    description: 'Products found successfully with price information',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              brand: { type: 'string' },
              model: { type: 'string' },
              fullName: { type: 'string' },
              storeCount: { type: 'number' },
              totalVariants: { type: 'number' },
              image: { type: 'string' },
              specifications: { type: 'object' },
              priceRange: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' },
                  avg: { type: 'number' },
                },
              },
              stores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    store: { type: 'object' },
                    product: { type: 'object' },
                    price: { type: 'number' },
                  },
                },
              },
              createdAt: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
        query: { type: 'string' },
      },
    },
  })
  async searchProducts(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return { data: [], message: 'Query must be at least 2 characters' };
    }

    const products = await this._productMatchingService.searchProducts(query);

    // Filter out inactive products as an additional safety measure
    const activeProducts = products.filter((product) => product.isActive);

    this._logger.log(
      `Search returned ${products.length} products, ${activeProducts.length} active`,
    );

    // Get detailed info for each product including price data
    const productsWithDetails = await Promise.all(
      activeProducts.map(async (product) => {
        try {
          const details =
            await this._productMatchingService.getProductWithImagesAndSpecs(
              product.id,
            );
          const comparison =
            await this._productMatchingService.getProductComparison(product.id);

          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model,
            fullName: product.fullName,
            storeCount: product.storeCount,
            totalVariants: product.totalVariants,
            image: details.image,
            specifications: details.specifications,
            priceRange: comparison.priceRange,
            stores: comparison.stores.map((store) => ({
              store: {
                id: store.store.id,
                name: store.store.name,
                website: store.store.website,
                type: store.store.type,
                isVerified: store.store.isVerified,
              },
              product: {
                id: store.product.id,
                name: store.product.name,
                price: store.product.price,
                url: store.product.url,
                image: store.product.image,
                lastScraped: store.product.lastScraped,
                metadata: store.product.metadata,
              },
              price: store.price,
            })),
            createdAt: product.createdAt,
          };
        } catch (error) {
          this._logger.warn(
            `Failed to get detailed info for product ${product.id}:`,
            error.message,
          );
          // Fallback to basic product info if detailed fetch fails
          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            model: product.model,
            fullName: product.fullName,
            storeCount: product.storeCount,
            totalVariants: product.totalVariants,
            image: product.image,
            specifications: {
              rating: null,
              categories: ['Toallas de Papel'],
              originalData: {
                brand: product.brand,
                categories: ['Toallas de Papel'],
                highResImageUrl: product.image,
              },
            },
            priceRange: {
              min: 0,
              max: 0,
              avg: 0,
            },
            stores: [],
            createdAt: product.createdAt,
          };
        }
      }),
    );

    return {
      data: productsWithDetails,
      total: activeProducts.length,
      query,
    };
  }

  @Get('duplicates')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.ADMIN,
    RoleType.STORE_ADMIN,
    RoleType.CUSTOMER,
  )
  @Permissions(PermissionType.PRODUCT_READ, PermissionType.PRICE_READ)
  @ApiOperation({
    summary: 'Find duplicate products using traditional algorithm',
    description:
      'Uses traditional similarity algorithm to find duplicate products. Fast and efficient.',
  })
  @ApiQuery({
    name: 'threshold',
    description: 'Similarity threshold (0.1-1.0)',
    required: false,
    example: 0.7,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of groups to return',
    required: false,
    example: 50,
  })
  @ApiQuery({
    name: 'brand',
    description: 'Filter by specific brand',
    required: false,
    example: 'Nova',
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate groups found successfully',
    schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              count: { type: 'number' },
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    brand: { type: 'string' },
                    image: { type: 'string' },
                    store: { type: 'string' },
                    price: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        total: { type: 'number' },
        threshold: { type: 'number' },
      },
    },
  })
  async findDuplicates(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
    @Query('brand') brand?: string,
  ) {
    const thresholdNum = threshold ? parseFloat(threshold) : 0.3;
    const limitNum = limit ? parseInt(limit) : 200;

    if (thresholdNum < 0.1 || thresholdNum > 1.0) {
      throw new BadRequestException('Threshold must be between 0.1 and 1.0');
    }

    if (limitNum < 1 || limitNum > 200) {
      throw new BadRequestException('Limit must be between 1 and 200');
    }

    this._logger.log(
      `Finding duplicates with traditional algorithm - threshold: ${thresholdNum}, limit: ${limitNum}`,
    );

    // Use traditional duplicate detection
    const groups = await this._productMatchingService.findDuplicateGroups({
      threshold: thresholdNum,
      limit: limitNum,
      brand,
    });

    return {
      groups,
      total: groups.length,
      threshold: thresholdNum,
    };
  }

  @Get(':id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.ADMIN,
    RoleType.STORE_ADMIN,
    RoleType.CUSTOMER,
  )
  @Permissions(PermissionType.PRODUCT_READ, PermissionType.PRICE_READ)
  @ApiOperation({ summary: 'Get product comparison by base product ID' })
  @ApiParam({ name: 'id', description: 'Base product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product comparison retrieved successfully',
  })
  async getProductComparison(@Param('id') id: string) {
    // Validar que el ID sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(
        'Invalid product ID format. Must be a valid UUID.',
      );
    }

    const comparison =
      await this._productMatchingService.getProductComparison(id);

    return {
      product: {
        id: comparison.baseProduct.id,
        name: comparison.baseProduct.name,
        brand: comparison.baseProduct.brand,
        model: comparison.baseProduct.model,
        fullName: comparison.baseProduct.fullName,
        description: comparison.baseProduct.description,
        image: comparison.baseProduct.image,
        specifications: comparison.baseProduct.specifications,
        storeCount: comparison.baseProduct.storeCount,
        totalVariants: comparison.baseProduct.totalVariants,
      },
      priceRange: comparison.priceRange,
      stores: comparison.stores.map((store) => ({
        store: {
          id: store.store.id,
          name: store.store.name,
          website: store.store.website,
          type: store.store.type,
          isVerified: store.store.isVerified,
        },
        product: {
          id: store.product.id,
          name: store.product.name,
          price: store.product.price,
          url: store.product.url,
          image: store.product.image,
          lastScraped: store.product.lastScraped,
          metadata: store.product.metadata,
        },
        price: store.price,
      })),
      totalStores: comparison.stores.length,
      lastUpdated: new Date().toISOString(),
    };
  }
}
