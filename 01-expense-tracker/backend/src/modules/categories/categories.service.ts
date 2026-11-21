import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCategories(userId: string) {
    return this.prisma.transactionCategory.findMany({
      where: { userId },
      include: { subCategories: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(userId: string, data: { name: string; colorHex?: string; iconName?: string; parentCategoryId?: string }) {
    const existing = await this.prisma.transactionCategory.findUnique({
      where: { userId_name: { userId, name: data.name } },
    });
    if (existing) {
      throw new ConflictException(`Category "${data.name}" already exists`);
    }

    return this.prisma.transactionCategory.create({
      data: {
        userId,
        name: data.name,
        colorHex: data.colorHex || '#10b981',
        iconName: data.iconName || 'tag',
        parentCategoryId: data.parentCategoryId || null,
      },
    });
  }

  async findAllTags(userId: string) {
    return this.prisma.transactionTag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(userId: string, data: { name: string; colorHex?: string }) {
    const existing = await this.prisma.transactionTag.findUnique({
      where: { userId_name: { userId, name: data.name } },
    });
    if (existing) {
      throw new ConflictException(`Tag "${data.name}" already exists`);
    }

    return this.prisma.transactionTag.create({
      data: {
        userId,
        name: data.name,
        colorHex: data.colorHex || '#6b7280',
      },
    });
  }
}
