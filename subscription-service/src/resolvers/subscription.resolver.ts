import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { SubscriptionEntity } from '@model/entities/subscription.entity';
import { CreateSubscriptionInput } from '@model/dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@model/dtos/update-subscription.dto';
import { SubscriptionService } from '@service/subscription.service'

@Resolver(() => SubscriptionEntity)
export class SubscriptionResolver {
  constructor(private readonly service: SubscriptionService) {}

  @Query(() => SubscriptionEntity)
  subscription(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.service.findById(id);
  }

  @Mutation(() => SubscriptionEntity)
  createSubscription(
    @Args('input') input: CreateSubscriptionInput,
  ) {
    return this.service.create(input);
  }

  @Mutation(() => SubscriptionEntity)
  updateSubscription(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSubscriptionInput,
  ) {
    return this.service.update(id, input);
  }
}
