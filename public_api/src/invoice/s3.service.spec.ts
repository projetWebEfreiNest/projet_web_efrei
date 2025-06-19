import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: any;

  beforeEach(async () => {
    mockS3Client = {
      send: jest.fn(),
    };

    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3 successfully', async () => {
      const mockFile = {
        originalname: 'test-invoice.pdf',
        buffer: Buffer.from('test file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const userId = 123;

      mockS3Client.send.mockResolvedValue({});

      const result = await service.uploadFile(mockFile, userId);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand),
      );
      expect(result).toMatch(/^s3:\/\/.*\/invoices\/123\/.*\.pdf$/);
    });

    it('should handle upload errors', async () => {
      const mockFile = {
        originalname: 'test-invoice.pdf',
        buffer: Buffer.from('test file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const userId = 123;

      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      await expect(service.uploadFile(mockFile, userId)).rejects.toThrow(
        'S3 upload failed',
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3 successfully', async () => {
      const filePath = 's3://invoice-files/invoices/123/test-file.pdf';

      mockS3Client.send.mockResolvedValue({});

      await service.deleteFile(filePath);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand),
      );
    });

    it('should throw error for invalid file path', async () => {
      const invalidFilePath = 'invalid-path';

      await expect(service.deleteFile(invalidFilePath)).rejects.toThrow(
        'Invalid S3 file path',
      );
    });

    it('should handle delete errors', async () => {
      const filePath = 's3://invoice-files/invoices/123/test-file.pdf';

      mockS3Client.send.mockRejectedValue(new Error('S3 delete failed'));

      await expect(service.deleteFile(filePath)).rejects.toThrow(
        'S3 delete failed',
      );
    });
  });
});
