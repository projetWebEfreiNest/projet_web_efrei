import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { TagWithUsage } from './dto/tag-with-usage.dto';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private readonly tagService: TagService) {}

  @Mutation(() => Tag)
  @UseGuards(JwtAuthGuard)
  async createTag(
    @Args('createTagInput') createTagInput: CreateTagInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    return this.tagService.create(createTagInput, userId);
  }

  @Query(() => [Tag], { name: 'tags' })
  @UseGuards(JwtAuthGuard)
  async findAll(@Context() context: any) {
    const userId = context.req.user.userId;
    return this.tagService.findAll(userId);
  }

  @Query(() => Tag, { name: 'tag' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    return this.tagService.findOne(id, userId);
  }

  @Mutation(() => Tag)
  @UseGuards(JwtAuthGuard)
  async updateTag(
    @Args('updateTagInput') updateTagInput: UpdateTagInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    return this.tagService.update(updateTagInput.id, updateTagInput, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeTag(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    const result = await this.tagService.remove(id, userId);
    return result.success;
  }

  @Query(() => [TagWithUsage], { name: 'tagsWithUsage' })
  @UseGuards(JwtAuthGuard)
  async getTagsUsageStats(@Context() context: any) {
    const userId = context.req.user.userId;
    return this.tagService.getTagsUsageStats(userId);
  }
}
