import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

// Types pour les invoices
enum InvoiceType {
  EMIS = 'EMIS',
  RECUS = 'RECUS',
}

@InputType()
export class CreateInvoiceInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  date: Date;

  @Field(() => String)
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  tagIds?: number[] | string; // Peut être un tableau ou une chaîne (pour multipart)
}
