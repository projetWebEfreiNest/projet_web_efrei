import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Tag } from '../../tag/entities/tag.entity';

// Types pour GraphQL
type InvoiceType = 'EMIS' | 'RECUS';
type InvoiceStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

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

  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];
}
