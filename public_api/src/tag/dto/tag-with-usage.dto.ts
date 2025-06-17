import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Tag } from '../entities/tag.entity';

@ObjectType()
export class TagWithUsage extends Tag {
  @Field(() => Int)
  usageCount: number;
}
