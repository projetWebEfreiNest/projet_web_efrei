import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';

describe('TagService', () => {
  let service: TagService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invoiceTag: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const createTagInput: CreateTagInput = {
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
      };
      const userId = 1;
      const expectedTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tag.create.mockResolvedValue(expectedTag);

      const result = await service.create(createTagInput, userId);

      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: {
          name: createTagInput.name,
          description: createTagInput.description,
          colors: createTagInput.colors,
          userId,
        },
      });
      expect(result).toEqual(expectedTag);
    });

    it('should create a tag with default values', async () => {
      const createTagInput: CreateTagInput = {
        name: 'Test Tag',
      };
      const userId = 1;
      const expectedTag = {
        id: 1,
        name: 'Test Tag',
        description: '',
        colors: '#3B82F6',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tag.create.mockResolvedValue(expectedTag);

      const result = await service.create(createTagInput, userId);

      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: {
          name: createTagInput.name,
          description: '',
          colors: '#3B82F6',
          userId,
        },
      });
      expect(result).toEqual(expectedTag);
    });
  });

  describe('findAll', () => {
    it('should return all tags for a user', async () => {
      const userId = 1;
      const expectedTags = [
        {
          id: 1,
          name: 'Tag 1',
          description: 'Description 1',
          colors: '#FF0000',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Tag 2',
          description: 'Description 2',
          colors: '#00FF00',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.tag.findMany.mockResolvedValue(expectedTags);

      const result = await service.findAll(userId);

      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedTags);
    });
  });

  describe('findOne', () => {
    it('should return a tag if it exists and belongs to user', async () => {
      const tagId = 1;
      const userId = 1;
      const expectedTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tag.findFirst.mockResolvedValue(expectedTag);

      const result = await service.findOne(tagId, userId);

      expect(mockPrismaService.tag.findFirst).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(result).toEqual(expectedTag);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      const tagId = 1;
      const userId = 1;

      mockPrismaService.tag.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tagId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tag belongs to another user', async () => {
      const tagId = 1;
      const userId = 1;

      // Le findFirst avec userId=1 ne trouvera pas le tag car il appartient à userId=2
      mockPrismaService.tag.findFirst.mockResolvedValue(null);

      await expect(service.findOne(tagId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tag successfully', async () => {
      const tagId = 1;
      const userId = 1;
      const updateTagInput: UpdateTagInput = {
        id: tagId,
        name: 'Updated Tag',
        description: 'Updated Description',
      };
      const existingTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedTag = {
        ...existingTag,
        name: 'Updated Tag',
        description: 'Updated Description',
      };

      mockPrismaService.tag.findFirst.mockResolvedValue(existingTag);
      mockPrismaService.tag.update.mockResolvedValue(updatedTag);

      const result = await service.update(tagId, updateTagInput, userId);

      expect(mockPrismaService.tag.update).toHaveBeenCalledWith({
        where: { id: tagId },
        data: {
          name: updateTagInput.name,
          description: updateTagInput.description,
          colors: updateTagInput.colors,
        },
      });
      expect(result).toEqual(updatedTag);
    });
  });

  describe('remove', () => {
    it('should remove a tag successfully', async () => {
      const tagId = 1;
      const userId = 1;
      const existingTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tag.findFirst.mockResolvedValue(existingTag);
      mockPrismaService.invoiceTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.tag.delete.mockResolvedValue(existingTag);

      const result = await service.remove(tagId, userId);

      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: tagId },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
