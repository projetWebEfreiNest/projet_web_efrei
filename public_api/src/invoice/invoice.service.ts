import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceInput } from './dto/update-invoice.input';
import { PaginatedInvoiceResponse } from './dto/paginated-invoice.dto';
import { S3Service } from './s3.service';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private rabbitMQService: RabbitMQService,
  ) {}

  async create(
    createInvoiceInput: CreateInvoiceInput,
    userId: number,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for invoice creation');
    }

    const filePath = await this.s3Service.uploadFile(file, userId);

    // Parser les tagIds si elles viennent comme chaîne de caractères
    let parsedTagIds: number[] | undefined;
    if (createInvoiceInput.tagIds) {
      if (Array.isArray(createInvoiceInput.tagIds)) {
        parsedTagIds = createInvoiceInput.tagIds;
      } else if (typeof createInvoiceInput.tagIds === 'string') {
        // Si c'est une chaîne, la parser (format: "1,2,3" ou JSON)
        try {
          parsedTagIds = JSON.parse(createInvoiceInput.tagIds);
        } catch {
          // Si ce n'est pas du JSON, essayer split par virgule
          parsedTagIds = createInvoiceInput.tagIds
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
        }
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        name: createInvoiceInput.name,
        date: createInvoiceInput.date,
        type: createInvoiceInput.type,
        filePath,
        userId,
        status: 'UPLOADED', // Statut initial
        invoiceTags:
          parsedTagIds && parsedTagIds.length > 0
            ? {
                create: parsedTagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
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

    // Mettre à jour le statut à PROCESSING avant envoi vers OCR
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PROCESSING' },
    });

    // Envoyer le fichier à l'OCR service via RabbitMQ
    await this.rabbitMQService.sendToOCR(
      invoice.id,
      file.buffer,
      file.originalname,
    );

    return { ...invoice, status: 'PROCESSING' };
  }

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 10,
    tagIds?: number[],
  ): Promise<PaginatedInvoiceResponse> {
    const skip = (page - 1) * limit;

    // Construire la condition where
    const whereCondition: any = { userId };

    // Si des tags sont spécifiés, filtrer par ces tags
    if (tagIds && tagIds.length > 0) {
      whereCondition.invoiceTags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: whereCondition,
        skip,
        take: limit,
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
      }),
      this.prisma.invoice.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      invoices,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number, userId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
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

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(
    id: number,
    updateInvoiceInput: UpdateInvoiceInput,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const existingInvoice = await this.findOne(id, userId);

    let filePath = existingInvoice.filePath;

    if (file) {
      if (existingInvoice.filePath) {
        await this.s3Service.deleteFile(existingInvoice.filePath);
      }
      filePath = await this.s3Service.uploadFile(file, userId);
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        name: updateInvoiceInput.name,
        date: updateInvoiceInput.date,
        type: updateInvoiceInput.type,
        filePath,
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

    if (updateInvoiceInput.tagIds) {
      // Parser les tagIds si elles viennent comme chaîne de caractères
      let parsedTagIds: number[] | undefined;
      if (Array.isArray(updateInvoiceInput.tagIds)) {
        parsedTagIds = updateInvoiceInput.tagIds;
      } else if (typeof updateInvoiceInput.tagIds === 'string') {
        try {
          parsedTagIds = JSON.parse(updateInvoiceInput.tagIds);
        } catch {
          parsedTagIds = updateInvoiceInput.tagIds
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
        }
      }

      if (parsedTagIds && parsedTagIds.length > 0) {
        await this.prisma.invoiceTag.deleteMany({
          where: { invoiceId: id },
        });

        await this.prisma.invoiceTag.createMany({
          data: parsedTagIds.map((tagId) => ({
            invoiceId: id,
            tagId,
          })),
        });
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const invoice = await this.findOne(id, userId);

    // Supprimer d'abord les données de facture associées
    await this.prisma.invoiceData.deleteMany({
      where: { invoiceId: id },
    });

    // Supprimer les relations avec les tags
    await this.prisma.invoiceTag.deleteMany({
      where: { invoiceId: id },
    });

    // Supprimer le fichier S3 s'il existe
    if (invoice.filePath) {
      await this.s3Service.deleteFile(invoice.filePath);
    }

    // Enfin, supprimer la facture
    await this.prisma.invoice.delete({
      where: { id },
    });

    return { success: true, message: 'Invoice deleted successfully' };
  }

  async addInvoiceData(invoiceId: number, content: string, amount: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const invoiceData = await this.prisma.invoiceData.create({
      data: {
        content,
        amount,
        invoiceId,
      },
    });

    // Marquer la facture comme complétée après ajout des données
    await this.updateInvoiceStatus(invoiceId, 'COMPLETED');

    console.log(
      `Added invoice data for invoice ${invoiceId}: ${content} - ${amount}`,
    );
    return invoiceData;
  }

  async updateInvoiceStatus(invoiceId: number, status: string) {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: status as any },
    });

    console.log(`Updated invoice ${invoiceId} status to ${status}`);
  }

  async findByStatus(userId: number, status: string, tagIds?: number[]) {
    const whereCondition: any = {
      userId,
      status: status as any,
    };

    // Si des tags sont spécifiés, filtrer par ces tags
    if (tagIds && tagIds.length > 0) {
      whereCondition.invoiceTags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    return this.prisma.invoice.findMany({
      where: whereCondition,
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
  }

  async getProcessingCount(userId: number): Promise<number> {
    return this.prisma.invoice.count({
      where: {
        userId,
        status: 'PROCESSING',
      },
    });
  }

  async getStatusSummary(userId: number) {
    const statusCounts = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    });

    const total = await this.prisma.invoice.count({ where: { userId } });

    const summary = {
      total,
      uploaded: 0,
      processing: 0,
      completed: 0,
      error: 0,
    };

    statusCounts.forEach((count) => {
      summary[count.status.toLowerCase()] = count._count.status;
    });

    return summary;
  }
}
