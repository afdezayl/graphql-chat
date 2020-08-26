import {
  Resolver,
  Query,
  Mutation,
  Int,
  Args,
  Field,
  InputType,
  Subscription,
} from '@nestjs/graphql';
import { Message } from './message';
import { PubSub } from 'graphql-subscriptions';
@InputType()
export class PostMessageInput {
  @Field()
  content: string;
  @Field()
  user: string;
}

@Resolver(() => Message)
export class MessageResolver {
  private messages: Array<Message> = [];
  private pubsub = new PubSub();

  @Query(() => [Message], { name: 'messages' })
  getMessages(): Array<Message> {
    return this.messages;
  }

  @Mutation(() => Int)
  postMessage(@Args('data') data: PostMessageInput): number {
    const id = this.messages.length;
    const newMessage: Message = {
      id,
      content: data.content,
      user: data.user,
    };

    this.messages.push(newMessage);
    this.pubsub.publish('messageAdded', { messageAdded: newMessage });

    return id;
  }
  @Subscription(() => Message, { name: 'messageAdded' })
  messageAdded(): Message {
    return this.pubsub.asyncIterator('messageAdded');
  }
}
