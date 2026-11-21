import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  findCategories(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.findAllCategories(user.id);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; colorHex?: string; iconName?: string; parentCategoryId?: string },
  ) {
    return this.categoriesService.createCategory(user.id, body);
  }

  @Get('tags')
  findTags(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.findAllTags(user.id);
  }

  @Post('tags')
  createTag(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; colorHex?: string },
  ) {
    return this.categoriesService.createTag(user.id, body);
  }
}
