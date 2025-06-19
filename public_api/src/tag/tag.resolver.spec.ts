import { Test, TestingModule } from '@nestjs/testing';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';

describe('TagResolver', () => {
  let resolver: TagResolver;
  let tagService: TagService;

  const mockTagService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getTagsUsageStats: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagResolver,
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    resolver = module.get<TagResolver>(TagResolver);
    tagService = module.get<TagService>(TagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createTag', () => {
    it('should create a new tag', async () => {
      const createTagInput: CreateTagInput = {
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
      };
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
      const expectedTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTagService.create.mockResolvedValue(expectedTag);

      const result = await resolver.createTag(createTagInput, context);

      expect(mockTagService.create).toHaveBeenCalledWith(createTagInput, 1);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('findAll', () => {
    it('should return all tags for the user', async () => {
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
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
      ];

      mockTagService.findAll.mockResolvedValue(expectedTags);

      const result = await resolver.findAll(context);

      expect(mockTagService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedTags);
    });
  });

  describe('getTagsUsageStats', () => {
    it('should return all tags with usage for the user', async () => {
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
      const expectedTagsWithUsage = [
        {
          id: 1,
          name: 'Tag 1',
          description: 'Description 1',
          colors: '#FF0000',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 5,
        },
      ];

      mockTagService.getTagsUsageStats.mockResolvedValue(expectedTagsWithUsage);

      const result = await resolver.getTagsUsageStats(context);

      expect(mockTagService.getTagsUsageStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedTagsWithUsage);
    });
  });

  describe('findOne', () => {
    it('should return a specific tag', async () => {
      const tagId = 1;
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
      const expectedTag = {
        id: 1,
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTagService.findOne.mockResolvedValue(expectedTag);

      const result = await resolver.findOne(tagId, context);

      expect(mockTagService.findOne).toHaveBeenCalledWith(tagId, 1);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('updateTag', () => {
    it('should update a tag', async () => {
      const updateTagInput: UpdateTagInput = {
        id: 1,
        name: 'Updated Tag',
        description: 'Updated Description',
      };
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
      const expectedTag = {
        id: 1,
        name: 'Updated Tag',
        description: 'Updated Description',
        colors: '#FF0000',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTagService.update.mockResolvedValue(expectedTag);

      const result = await resolver.updateTag(updateTagInput, context);

      expect(mockTagService.update).toHaveBeenCalledWith(
        updateTagInput.id,
        updateTagInput,
        1,
      );
      expect(result).toEqual(expectedTag);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag', async () => {
      const tagId = 1;
      const context = {
        req: {
          user: { userId: 1 },
        },
      };
      const expectedResult = {
        success: true,
      };

      mockTagService.remove.mockResolvedValue(expectedResult);

      const result = await resolver.removeTag(tagId, context);

      expect(mockTagService.remove).toHaveBeenCalledWith(tagId, 1);
      expect(result).toBe(true);
    });
  });
});
