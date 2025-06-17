import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'invoice-files';
  }

  async uploadFile(file: Express.Multer.File, userId: number): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `invoices/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return `s3://${this.bucketName}/${fileName}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!filePath.startsWith('s3://')) {
      throw new Error('Invalid S3 file path');
    }

    const key = filePath.replace(`s3://${this.bucketName}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
