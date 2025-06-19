import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceResolver } from './invoice.resolver';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma.service';
import { S3Service } from './s3.service';
import { RabbitMQService } from './rabbitmq.service';

// Mock services
const mockPrismaService = {
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockS3Service = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

// Mock ClientProxy instances for RabbitMQ
const mockOcrClient = {
  emit: jest.fn(),
};

const mockTextTreatmentClient = {
  emit: jest.fn(),
};

const mockRabbitMQService = {
  sendToOCR: jest.fn(),
  emit: jest.fn(),
};

const mockInvoiceService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('InvoiceResolver', () => {
  let resolver: InvoiceResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceResolver,
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
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
        {
          provide: 'OCR_SERVICE',
          useValue: mockOcrClient,
        },
        {
          provide: 'TEXT_TREATMENT_SERVICE',
          useValue: mockTextTreatmentClient,
        },
      ],
    }).compile();

    resolver = module.get<InvoiceResolver>(InvoiceResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
