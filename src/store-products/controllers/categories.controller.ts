import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import {
  ICategoryResponse,
  ICategorySummary,
  type ICreateCategoryDto,
  type IUpdateCategoryDto,
} from '../interfaces/category.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleType } from '../../auth/entities/role.entity';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN, RoleType.CUSTOMER)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getAllCategories(): Promise<ICategoryResponse[]> {
    const categories = await this.categoriesService.getAllCategories();
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.displayName,
    }));
  }

  @Get('with-counts')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN, RoleType.CUSTOMER)
  @ApiOperation({ summary: 'Get all categories with product counts' })
  @ApiResponse({
    status: 200,
    description: 'Categories with product counts retrieved successfully',
  })
  async getCategoriesWithProductCount(): Promise<ICategoryResponse[]> {
    const categories = await this.categoriesService.getCategoriesWithProductCount();
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.displayName,
    }));
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.STORE_ADMIN, RoleType.CUSTOMER)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async getCategoryById(@Param('id') id: string): Promise<ICategoryResponse> {
    const category = await this.categoriesService.getCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.displayName,
    };
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({ type: Object })
  async createCategory(
    @Body() createCategoryDto: ICreateCategoryDto,
  ): Promise<ICategoryResponse> {
    const category = await this.categoriesService.createCategory(
      createCategoryDto.name,
      createCategoryDto.description,
      createCategoryDto.color,
      createCategoryDto.icon,
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.displayName,
    };
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: Object })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: IUpdateCategoryDto,
  ): Promise<ICategoryResponse> {
    const category = await this.categoriesService.updateCategory(id, updateCategoryDto);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.displayName,
    };
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete category (soft delete)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    await this.categoriesService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }
}
