import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceInput } from './dto/update-invoice.input';
enum InvoiceType {
  EMIS = 'EMIS',
  RECUS = 'RECU',
}

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let invoiceService: InvoiceService;

  const mockInvoiceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStatusSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    invoiceService = module.get<InvoiceService>(InvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new invoice', async () => {
      const createInvoiceInput: CreateInvoiceInput = {
        name: 'Test Invoice',
        date: new Date(),
        type: InvoiceType.EMIS,
        tagIds: [1, 2],
      };
      const mockFile = {
        originalname: 'test-invoice.pdf',
        buffer: Buffer.from('test file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedInvoice = {
        id: 1,
        name: 'Test Invoice',
        date: new Date(),
        type: InvoiceType.EMIS,
        userId: 1,
        filePath: 's3://bucket/file.pdf',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoiceService.create.mockResolvedValue(expectedInvoice);

      const result = await controller.create(
        createInvoiceInput,
        mockFile,
        mockRequest,
      );

      expect(mockInvoiceService.create).toHaveBeenCalledWith(
        createInvoiceInput,
        1,
        mockFile,
      );
      expect(result).toEqual(expectedInvoice);
    });
  });

  describe('findAll', () => {
    it('should return all invoices for the user', async () => {
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedInvoices = [
        {
          id: 1,
          name: 'Invoice 1',
          date: new Date(),
          type: InvoiceType.EMIS,
          userId: 1,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockInvoiceService.findAll.mockResolvedValue(expectedInvoices);

      const result = await controller.findAll(mockRequest);

      expect(mockInvoiceService.findAll).toHaveBeenCalledWith(
        1,
        1,
        10,
        undefined,
      );
      expect(result).toEqual(expectedInvoices);
    });
  });

  describe('findOne', () => {
    it('should return a specific invoice', async () => {
      const invoiceId = '1';
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedInvoice = {
        id: 1,
        name: 'Test Invoice',
        date: new Date(),
        type: InvoiceType.EMIS,
        userId: 1,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoiceService.findOne.mockResolvedValue(expectedInvoice);

      const result = await controller.findOne(invoiceId, mockRequest);

      expect(mockInvoiceService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedInvoice);
    });
  });

  describe('update', () => {
    it('should update an invoice', async () => {
      const invoiceId = '1';
      const updateInvoiceInput: UpdateInvoiceInput = {
        id: 1,
        name: 'Updated Invoice',
        date: new Date(),
        type: InvoiceType.RECUS,
      };
      const mockFile = {
        originalname: 'updated-invoice.pdf',
        buffer: Buffer.from('updated file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedInvoice = {
        id: 1,
        name: 'Updated Invoice',
        date: new Date(),
        type: InvoiceType.RECUS,
        userId: 1,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoiceService.update.mockResolvedValue(expectedInvoice);

      const result = await controller.update(
        invoiceId,
        updateInvoiceInput,
        mockFile,
        mockRequest,
      );

      expect(mockInvoiceService.update).toHaveBeenCalledWith(
        1,
        updateInvoiceInput,
        1,
        mockFile,
      );
      expect(result).toEqual(expectedInvoice);
    });
  });

  describe('remove', () => {
    it('should remove an invoice', async () => {
      const invoiceId = '1';
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedResult = { success: true };

      mockInvoiceService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(invoiceId, mockRequest);

      expect(mockInvoiceService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getStatusSummary', () => {
    it('should return status summary', async () => {
      const mockRequest = {
        user: { userId: 1 },
      };
      const expectedSummary = {
        pending: 5,
        processed: 10,
        failed: 2,
      };

      mockInvoiceService.getStatusSummary.mockResolvedValue(expectedSummary);

      const result = await controller.getStatusSummary(mockRequest);

      expect(mockInvoiceService.getStatusSummary).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedSummary);
    });
  });
});
