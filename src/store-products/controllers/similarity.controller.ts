import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';
import { ProductMatchingService } from '../services/product-matching.service';

@ApiTags('Product Similarity')
@Controller('products/similarity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SimilarityController {
  constructor(
    private readonly productMatchingService: ProductMatchingService,
  ) {}

  @Post('find-similar')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Find similar products',
    description:
      'Find products similar to a given product based on name, brand, and specifications',
  })
  @ApiBody({
    description: 'Product data to find similar products for',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name' },
        brand: { type: 'string', description: 'Product brand' },
        specifications: {
          type: 'object',
          description: 'Product specifications',
        },
        threshold: {
          type: 'number',
          description: 'Similarity threshold (0-1)',
          default: 0.8,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Similar products found successfully',
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
              brand: { type: 'string' },
              image: { type: 'string' },
              url: { type: 'string' },
              similarity: { type: 'number' },
              storeCount: { type: 'number' },
              totalVariants: { type: 'number' },
              createdAt: { type: 'string' },
              storeProducts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'number' },
                    image: { type: 'string' },
                    url: { type: 'string' },
                    store: { type: 'string' },
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
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findSimilarProducts(
    @Body()
    body: {
      name: string;
      brand?: string;
      specifications?: Record<string, any>;
      threshold?: number;
      limit?: number;
    },
  ) {
    const { name, brand, specifications, threshold = 0.8, limit = 10 } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error(
        'Product name is required and must be a non-empty string',
      );
    }

    const similarProducts =
      await this.productMatchingService.findSimilarProducts({
        name: name.trim(),
        brand,
        specifications,
        threshold,
        limit,
      });

    return {
      success: true,
      data: similarProducts,
      total: similarProducts.length,
      threshold,
    };
  }

  @Get('suggestions')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN, RoleType.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get product suggestions',
    description: 'Get product suggestions based on search query',
  })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({
    name: 'threshold',
    description: 'Similarity threshold (0-1)',
    required: false,
    default: 0.8,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    default: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Product suggestions retrieved successfully',
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
              brand: { type: 'string' },
              image: { type: 'string' },
              url: { type: 'string' },
              similarity: { type: 'number' },
              storeCount: { type: 'number' },
              totalVariants: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        query: { type: 'string' },
      },
    },
  })
  async getProductSuggestions(
    @Query('q') query: string,
    @Query('threshold') threshold: number = 0.8,
    @Query('limit') limit: number = 10,
  ) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error(
        'Search query is required and must be a non-empty string',
      );
    }

    const suggestions = await this.productMatchingService.findSimilarProducts({
      name: query.trim(),
      threshold: Number(threshold),
      limit: Number(limit),
    });

    return {
      success: true,
      data: suggestions,
      total: suggestions.length,
      query: query.trim(),
    };
  }
}
