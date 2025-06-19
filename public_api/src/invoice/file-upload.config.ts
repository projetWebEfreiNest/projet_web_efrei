import { BadRequestException } from '@nestjs/common';

export const fileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: any,
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new BadRequestException('File type not allowed'), false);
  }
};

export const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};
