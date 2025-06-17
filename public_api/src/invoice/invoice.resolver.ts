import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from './invoice.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceInput } from './dto/update-invoice.input';
import { PaginatedInvoiceResponse } from './dto/paginated-invoice.dto';
import {
  ProcessingStatusResponse,
  InvoiceStatusSummary,
} from './dto/status-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => Invoice)
@UseGuards(JwtAuthGuard)
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Mutation(() => Invoice)
  @UseInterceptors(FileInterceptor('file'))
  async createInvoice(
    @Args('createInvoiceInput') createInvoiceInput: CreateInvoiceInput,
    @Context() context: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = context.req.user.userId;
    return this.invoiceService.create(createInvoiceInput, userId, file);
  }

  @Query(() => PaginatedInvoiceResponse, { name: 'invoices' })
  async findAllInvoices(
    @Context() context: any,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    const userId = context.req.user.userId;
    return this.invoiceService.findAll(userId, page, limit);
  }

  @Query(() => Invoice, { name: 'invoice' })
  async findOneInvoice(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    return this.invoiceService.findOne(id, userId);
  }

  @Mutation(() => Invoice)
  @UseInterceptors(FileInterceptor('file'))
  async updateInvoice(
    @Args('updateInvoiceInput') updateInvoiceInput: UpdateInvoiceInput,
    @Context() context: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = context.req.user.userId;
    return this.invoiceService.update(
      updateInvoiceInput.id,
      updateInvoiceInput,
      userId,
      file,
    );
  }

  @Mutation(() => Boolean)
  async removeInvoice(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    const result = await this.invoiceService.remove(id, userId);
    return result.success;
  }

  @Query(() => [Invoice], { name: 'invoicesByStatus' })
  @UseGuards(JwtAuthGuard)
  async findByStatus(@Args('status') status: string, @Context() context: any) {
    const userId = context.req.user.userId;
    return this.invoiceService.findByStatus(userId, status);
  }

  @Query(() => ProcessingStatusResponse, { name: 'processingStatus' })
  @UseGuards(JwtAuthGuard)
  async getProcessingCount(@Context() context: any) {
    const userId = context.req.user.userId;
    const count = await this.invoiceService.getProcessingCount(userId);
    return { count, hasProcessing: count > 0 };
  }

  @Query(() => InvoiceStatusSummary, { name: 'invoiceStatusSummary' })
  @UseGuards(JwtAuthGuard)
  async getStatusSummary(@Context() context: any) {
    const userId = context.req.user.userId;
    return this.invoiceService.getStatusSummary(userId);
  }
}
