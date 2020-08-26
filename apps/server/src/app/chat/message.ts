import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field(() => Int)
  id: number;

  @Field({ nullable: false })
  user: string;

  @Field({ nullable: false })
  content: string;
}
