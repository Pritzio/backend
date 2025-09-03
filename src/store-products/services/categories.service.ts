import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findOrCreateCategories(categoryNames: string[]): Promise<Category[]> {
    if (!categoryNames || categoryNames.length === 0) {
      return [];
    }

    const categories: Category[] = [];
    
    for (const categoryName of categoryNames) {
      if (!categoryName || categoryName.trim() === '') {
        continue;
      }

      const trimmedName = categoryName.trim();
      
      try {
        // Find existing category
        let category = await this.categoryRepository.findOne({
          where: { name: trimmedName, isActive: true },
        });

        if (!category) {
          // Create new category
          category = this.categoryRepository.create({
            name: trimmedName,
            description: `Categoría creada automáticamente desde scraping: ${trimmedName}`,
            isActive: true,
            productCount: 0,
          });

          category = await this.categoryRepository.save(category);
          
          this.logger.log(`Created new category: ${trimmedName} (ID: ${category.id})`);
        }

        categories.push(category);
      } catch (error) {
        this.logger.error(`Error processing category "${trimmedName}":`, error);
        // Continue with next categories even if one fails
      }
    }

    return categories;
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id, isActive: true },
      relations: ['storeProducts'],
    });
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { name, isActive: true },
    });
  }

  async updateCategoryProductCount(categoryId: string): Promise<void> {
    const count = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.storeProducts', 'storeProduct')
      .where('category.id = :categoryId', { categoryId })
      .getCount();

    await this.categoryRepository.update(categoryId, { productCount: count });
  }

  async createCategory(
    name: string,
    description?: string,
    color?: string,
    icon?: string,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      name: name.trim(),
      description,
      color,
      icon,
      isActive: true,
      productCount: 0,
    });

    return await this.categoryRepository.save(category);
  }

  async updateCategory(
    id: string,
    updateData: Partial<Category>,
  ): Promise<Category | null> {
    await this.categoryRepository.update(id, updateData);
    return await this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    // Soft delete - mark as inactive
    await this.categoryRepository.update(id, { isActive: false });
  }

  async getCategoriesWithProductCount(): Promise<Category[]> {
    // Get all active categories with their products
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['storeProducts'],
      order: { name: 'ASC' },
    });

    // Map categories to include product count
    return categories.map(category => {
      category.productCount = category.storeProducts?.length || 0;
      return category;
    });
  }
}
