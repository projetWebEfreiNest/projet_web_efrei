import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceInput } from './dto/update-invoice.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { fileFilter, limits } from './file-upload.config';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits }))
  async create(
    @Body() createInvoiceInput: CreateInvoiceInput,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.invoiceService.create(
      createInvoiceInput,
      req.user.userId,
      file,
    );
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ) {
    return this.invoiceService.findAll(req.user.userId, page, limit);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: string, @Request() req: any) {
    return this.invoiceService.findByStatus(req.user.userId, status);
  }

  @Get('processing/count')
  async getProcessingCount(@Request() req: any) {
    const count = await this.invoiceService.getProcessingCount(req.user.userId);
    return { count, hasProcessing: count > 0 };
  }

  @Get('status/summary')
  async getStatusSummary(@Request() req: any) {
    return this.invoiceService.getStatusSummary(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.invoiceService.findOne(+id, req.user.userId);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits }))
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceInput: UpdateInvoiceInput,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.invoiceService.update(
      +id,
      updateInvoiceInput,
      req.user.userId,
      file,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.invoiceService.remove(+id, req.user.userId);
  }
}
