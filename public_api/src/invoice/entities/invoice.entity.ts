import { ObjectType, Field, Int } from '@nestjs/graphql';
import { InvoiceType, InvoiceStatus } from '@prisma/client';

@ObjectType()
export class InvoiceData {
  @Field(() => Int)
  id: number;

  @Field()
  content: string;

  @Field()
  amount: number;

  @Field(() => Int)
  invoiceId: number;
}

@ObjectType()
export class Invoice {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  filePath?: string;

  @Field()
  createdAt: Date;

  @Field()
  date: Date;

  @Field(() => String)
  type: InvoiceType;

  @Field(() => String)
  status: InvoiceStatus;

  @Field(() => Int)
  userId: number;

  @Field(() => [InvoiceData], { nullable: true })
  invoiceData?: InvoiceData[];
}
