import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma.service';
import { S3Service } from './s3.service';
import { RabbitMQService } from './rabbitmq.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceInput } from './dto/update-invoice.input';

// Types pour les tests
enum InvoiceType {
  EMIS = 'EMIS',
  RECUS = 'RECUS',
}

describe('InvoiceService', () => {
  let service: InvoiceService;
  let prismaService: PrismaService;
  let s3Service: S3Service;
  let rabbitMQService: RabbitMQService;
  let consoleLogSpy: jest.SpyInstance;

  const mockPrismaService = {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    invoiceData: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    invoiceTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockRabbitMQService = {
    sendToOCR: jest.fn(),
    sendToTextTreatment: jest.fn(),
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    prismaService = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockFile = {
      originalname: 'test-invoice.pdf',
      buffer: Buffer.from('test file content'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    const createInvoiceInput: CreateInvoiceInput = {
      name: 'Test Invoice',
      date: new Date(),
      type: InvoiceType.EMIS,
      tagIds: [1, 2],
    };

    it('should create an invoice successfully', async () => {
      const userId = 1;
      const filePath = 's3://bucket/file.pdf';
      const createdInvoice = {
        id: 1,
        name: 'Test Invoice',
        date: createInvoiceInput.date,
        type: InvoiceType.EMIS,
        filePath,
        userId,
        status: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
        invoiceData: null,
        invoiceTags: [],
      };

      mockS3Service.uploadFile.mockResolvedValue(filePath);
      mockPrismaService.invoice.create.mockResolvedValue(createdInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...createdInvoice,
        status: 'PROCESSING',
      });
      mockRabbitMQService.sendToOCR.mockResolvedValue(undefined);

      const result = await service.create(createInvoiceInput, userId, mockFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, userId);
      expect(mockPrismaService.invoice.create).toHaveBeenCalledWith({
        data: {
          name: createInvoiceInput.name,
          date: createInvoiceInput.date,
          type: createInvoiceInput.type,
          filePath,
          userId,
          status: 'UPLOADED',
          invoiceTags: {
            create: [{ tagId: 1 }, { tagId: 2 }],
          },
        },
        include: {
          invoiceData: true,
          invoiceTags: {
            include: {
              tag: true,
            },
          },
        },
      });
      expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'PROCESSING' },
      });
      expect(mockRabbitMQService.sendToOCR).toHaveBeenCalledWith(
        1,
        mockFile.buffer,
        mockFile.originalname,
      );
      expect(result.status).toBe('PROCESSING');
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const userId = 1;

      await expect(service.create(createInvoiceInput, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle string tagIds correctly', async () => {
      const userId = 1;
      const filePath = 's3://bucket/file.pdf';
      const inputWithStringTagIds = {
        ...createInvoiceInput,
        tagIds: '1,2,3' as any,
      };

      mockS3Service.uploadFile.mockResolvedValue(filePath);
      mockPrismaService.invoice.create.mockResolvedValue({
        id: 1,
        status: 'UPLOADED',
      });
      mockPrismaService.invoice.update.mockResolvedValue({
        id: 1,
        status: 'PROCESSING',
      });

      await service.create(inputWithStringTagIds, userId, mockFile);

      expect(mockPrismaService.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invoiceTags: {
            create: [{ tagId: 1 }, { tagId: 2 }, { tagId: 3 }],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const mockInvoices = [
        {
          id: 1,
          name: 'Invoice 1',
          userId,
          createdAt: new Date(),
        },
      ];
      const totalCount = 1;

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.invoice.count.mockResolvedValue(totalCount);

      const result = await service.findAll(userId, page, limit);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
        include: {
          invoiceData: true,
          invoiceTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual({
        invoices: mockInvoices,
        total: totalCount,
        page,
        limit,
        totalPages: 1,
      });
    });

    it('should filter by tagIds when provided', async () => {
      const userId = 1;
      const tagIds = [1, 2];

      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      await service.findAll(userId, 1, 10, tagIds);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          invoiceTags: {
            some: {
              tagId: {
                in: tagIds,
              },
            },
          },
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return an invoice if it exists and belongs to user', async () => {
      const invoiceId = 1;
      const userId = 1;
      const mockInvoice = {
        id: invoiceId,
        name: 'Test Invoice',
        userId,
        invoiceData: null,
        invoiceTags: [],
      };

      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne(invoiceId, userId);

      expect(mockPrismaService.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: invoiceId,
          userId,
        },
        include: {
          invoiceData: true,
          invoiceTags: {
            include: {
              tag: true,
            },
          },
        },
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      const invoiceId = 1;
      const userId = 1;

      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(invoiceId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateInvoiceInput: UpdateInvoiceInput = {
      id: 1,
      name: 'Updated Invoice',
      date: new Date(),
      type: InvoiceType.RECUS,
    };

    it('should update an invoice successfully', async () => {
      const invoiceId = 1;
      const userId = 1;
      const existingInvoice = {
        id: invoiceId,
        name: 'Old Invoice',
        filePath: 's3://bucket/old-file.pdf',
        userId,
      };
      const updatedInvoice = {
        ...existingInvoice,
        name: 'Updated Invoice',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingInvoice as any);
      mockPrismaService.invoice.update.mockResolvedValue(updatedInvoice);

      const result = await service.update(
        invoiceId,
        updateInvoiceInput,
        userId,
      );

      expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          name: updateInvoiceInput.name,
          date: updateInvoiceInput.date,
          type: updateInvoiceInput.type,
          filePath: existingInvoice.filePath,
        },
        include: {
          invoiceData: true,
          invoiceTags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('should update file if new file is provided', async () => {
      const invoiceId = 1;
      const userId = 1;
      const newFile = {
        originalname: 'new-file.pdf',
        buffer: Buffer.from('new content'),
      } as Express.Multer.File;
      const existingInvoice = {
        id: invoiceId,
        filePath: 's3://bucket/old-file.pdf',
        userId,
      };
      const newFilePath = 's3://bucket/new-file.pdf';

      jest.spyOn(service, 'findOne').mockResolvedValue(existingInvoice as any);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockS3Service.uploadFile.mockResolvedValue(newFilePath);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...existingInvoice,
        filePath: newFilePath,
      });

      await service.update(invoiceId, updateInvoiceInput, userId, newFile);

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(
        existingInvoice.filePath,
      );
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(newFile, userId);
      expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: expect.objectContaining({
          filePath: newFilePath,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should remove an invoice successfully', async () => {
      const invoiceId = 1;
      const userId = 1;
      const invoice = {
        id: invoiceId,
        filePath: 's3://bucket/file.pdf',
        userId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(invoice as any);
      mockPrismaService.invoiceData.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.invoiceTag.deleteMany.mockResolvedValue({ count: 2 });
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.invoice.delete.mockResolvedValue(invoice);

      const result = await service.remove(invoiceId, userId);

      expect(mockPrismaService.invoiceData.deleteMany).toHaveBeenCalledWith({
        where: { invoiceId },
      });
      expect(mockPrismaService.invoiceTag.deleteMany).toHaveBeenCalledWith({
        where: { invoiceId },
      });
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(invoice.filePath);
      expect(mockPrismaService.invoice.delete).toHaveBeenCalledWith({
        where: { id: invoiceId },
      });
      expect(result).toEqual({
        success: true,
        message: 'Invoice deleted successfully',
      });
    });
  });

  describe('addInvoiceData', () => {
    it('should add invoice data successfully', async () => {
      const invoiceId = 1;
      const content = 'Invoice content';
      const amount = 1234.56;
      const invoice = { id: invoiceId };
      const invoiceData = { id: 1, content, amount, invoiceId };

      mockPrismaService.invoice.findUnique.mockResolvedValue(invoice);
      mockPrismaService.invoiceData.create.mockResolvedValue(invoiceData);
      jest.spyOn(service, 'updateInvoiceStatus').mockResolvedValue(undefined);

      const result = await service.addInvoiceData(invoiceId, content, amount);

      expect(mockPrismaService.invoiceData.create).toHaveBeenCalledWith({
        data: {
          content,
          amount,
          invoiceId,
        },
      });
      expect(service.updateInvoiceStatus).toHaveBeenCalledWith(
        invoiceId,
        'COMPLETED',
      );
      expect(result).toEqual(invoiceData);
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      const invoiceId = 1;
      const content = 'Invoice content';
      const amount = 1234.56;

      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.addInvoiceData(invoiceId, content, amount),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status successfully', async () => {
      const invoiceId = 1;
      const status = 'COMPLETED';

      mockPrismaService.invoice.update.mockResolvedValue({
        id: invoiceId,
        status,
      });

      await service.updateInvoiceStatus(invoiceId, status);

      expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { status },
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Updated invoice ${invoiceId} status to ${status}`,
      );
    });
  });

  describe('findByStatus', () => {
    it('should find invoices by status', async () => {
      const userId = 1;
      const status = 'COMPLETED';
      const mockInvoices = [{ id: 1, status, userId }];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.findByStatus(userId, status);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status,
        },
        include: {
          invoiceData: true,
          invoiceTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should filter by tagIds when provided', async () => {
      const userId = 1;
      const status = 'COMPLETED';
      const tagIds = [1, 2];

      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      await service.findByStatus(userId, status, tagIds);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status,
          invoiceTags: {
            some: {
              tagId: {
                in: tagIds,
              },
            },
          },
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('getProcessingCount', () => {
    it('should return processing count', async () => {
      const userId = 1;
      const count = 5;

      mockPrismaService.invoice.count.mockResolvedValue(count);

      const result = await service.getProcessingCount(userId);

      expect(mockPrismaService.invoice.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'PROCESSING',
        },
      });
      expect(result).toBe(count);
    });
  });

  describe('getStatusSummary', () => {
    it('should return status summary', async () => {
      const userId = 1;
      const statusCounts = [
        { status: 'UPLOADED', _count: { status: 2 } },
        { status: 'PROCESSING', _count: { status: 3 } },
        { status: 'COMPLETED', _count: { status: 5 } },
      ];
      const total = 10;

      mockPrismaService.invoice.groupBy.mockResolvedValue(statusCounts);
      mockPrismaService.invoice.count.mockResolvedValue(total);

      const result = await service.getStatusSummary(userId);

      expect(mockPrismaService.invoice.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      });
      expect(result).toEqual({
        total,
        uploaded: 2,
        processing: 3,
        completed: 5,
        error: 0,
      });
    });
  });
});
