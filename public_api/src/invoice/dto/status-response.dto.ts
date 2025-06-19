import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ProcessingStatusResponse {
  @Field(() => Int)
  count: number;

  @Field()
  hasProcessing: boolean;
}

@ObjectType()
export class InvoiceStatusSummary {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  uploaded: number;

  @Field(() => Int)
  processing: number;

  @Field(() => Int)
  completed: number;

  @Field(() => Int)
  error: number;
}
