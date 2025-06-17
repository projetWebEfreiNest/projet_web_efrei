import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateTagInput } from './create-tag.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateTagInput extends PartialType(CreateTagInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
