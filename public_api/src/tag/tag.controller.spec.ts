import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';

describe('TagController', () => {
  let controller: TagController;
  let tagService: TagService;

  const mockTagService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getTagsUsageStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    controller = module.get<TagController>(TagController);
    tagService = module.get<TagService>(TagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const createTagInput: CreateTagInput = {
        name: 'Test Tag',
        description: 'Test Description',
        colors: '#FF0000',
      };
      const mockRequest = {
        user: { userId: 1 },
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

      const result = await controller.create(createTagInput, mockRequest);

      expect(mockTagService.create).toHaveBeenCalledWith(createTagInput, 1);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('findAll', () => {
    it('should return all tags for the user', async () => {
      const mockRequest = {
        user: { userId: 1 },
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

      const result = await controller.findAll(mockRequest);

      expect(mockTagService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedTags);
    });
  });

  describe('findOne', () => {
    it('should return a specific tag', async () => {
      const tagId = '1';
      const mockRequest = {
        user: { userId: 1 },
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

      const result = await controller.findOne(tagId, mockRequest);

      expect(mockTagService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const tagId = '1';
      const updateTagInput: UpdateTagInput = {
        id: 1,
        name: 'Updated Tag',
        description: 'Updated Description',
      };
      const mockRequest = {
        user: { userId: 1 },
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

      const result = await controller.update(
        tagId,
        updateTagInput,
        mockRequest,
      );

      expect(mockTagService.update).toHaveBeenCalledWith(1, updateTagInput, 1);
      expect(result).toEqual(expectedTag);
    });
  });

  describe('remove', () => {
    it('should remove a tag', async () => {
      const tagId = '1';
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedResult = { success: true };

      mockTagService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(tagId, mockRequest);

      expect(mockTagService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTagsUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedStats = [
        {
          id: 1,
          name: 'Tag 1',
          usageCount: 5,
        },
      ];

      mockTagService.getTagsUsageStats.mockResolvedValue(expectedStats);

      const result = await controller.getTagsUsageStats(mockRequest);

      expect(mockTagService.getTagsUsageStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedStats);
    });
  });
});
