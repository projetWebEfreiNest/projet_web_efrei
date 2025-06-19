import { Test, TestingModule } from '@nestjs/testing';
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

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
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

    service = module.get<InvoiceService>(InvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
