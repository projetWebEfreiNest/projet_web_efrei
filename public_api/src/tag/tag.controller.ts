import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  async create(@Body() createTagInput: CreateTagInput, @Request() req: any) {
    return this.tagService.create(createTagInput, req.user.userId);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.tagService.findAll(req.user.userId);
  }

  @Get('stats')
  async getTagsUsageStats(@Request() req: any) {
    return this.tagService.getTagsUsageStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.tagService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTagInput: UpdateTagInput,
    @Request() req: any,
  ) {
    return this.tagService.update(+id, updateTagInput, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.tagService.remove(+id, req.user.userId);
  }
}
