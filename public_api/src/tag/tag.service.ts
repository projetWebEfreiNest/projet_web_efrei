import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async create(createTagInput: CreateTagInput, userId: number) {
    return this.prisma.tag.create({
      data: {
        name: createTagInput.name,
        description: createTagInput.description || '',
        colors: createTagInput.colors || '#3B82F6',
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: number, updateTagInput: UpdateTagInput, userId: number) {
    // Vérifier que le tag appartient à l'utilisateur
    const existingTag = await this.findOne(id, userId);

    return this.prisma.tag.update({
      where: { id },
      data: {
        name: updateTagInput.name,
        description: updateTagInput.description,
        colors: updateTagInput.colors,
      },
    });
  }

  async remove(id: number, userId: number) {
    // Vérifier que le tag appartient à l'utilisateur
    await this.findOne(id, userId);

    // Supprimer d'abord les relations avec les factures
    await this.prisma.invoiceTag.deleteMany({
      where: { tagId: id },
    });

    // Puis supprimer le tag
    await this.prisma.tag.delete({
      where: { id },
    });

    return { success: true };
  }

  async getTagsUsageStats(userId: number) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { invoiceTags: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tags.map((tag) => ({
      ...tag,
      usageCount: tag._count.invoiceTags,
    }));
  }
}
