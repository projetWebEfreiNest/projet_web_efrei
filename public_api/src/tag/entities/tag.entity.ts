import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Tag {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  colors: string;

  @Field()
  createdAt: Date;

  @Field(() => Int)
  userId: number;
}
