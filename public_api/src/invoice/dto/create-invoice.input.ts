import { InputType, Field, Int } from '@nestjs/graphql';
import { InvoiceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

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
  @IsArray()
  tagIds?: number[];
}
