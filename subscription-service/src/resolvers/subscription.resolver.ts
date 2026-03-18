import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { SubscriptionEntity } from '@model/entities/subscription.entity';
import { CreateSubscriptionInput } from '@model/dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@model/dtos/update-subscription.dto';
import { SubscriptionService } from '@service/subscription.service'
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('subscription-service');

@Resolver(() => SubscriptionEntity)
export class SubscriptionResolver {
  constructor(private readonly service: SubscriptionService) {}

  @Query(() => SubscriptionEntity)
  async subscription(
    @Args('id', { type: () => ID }) id: string,
  ) {
    const span = tracer.startSpan('subscription.query', undefined, context.active());
    try {
      return await this.service.findById(id);
    } finally {
      span.end();
    }
  }

  @Mutation(() => SubscriptionEntity)
  async createSubscription(
    @Args('input') input: CreateSubscriptionInput,
  ) {
    const span = tracer.startSpan('subscription.create', undefined, context.active());
    try {
      return await this.service.create(input);
    } finally {
      span.end();
    }
  }

  @Mutation(() => SubscriptionEntity)
  updateSubscription(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSubscriptionInput,
  ) {
    return this.service.update(id, input);
  }
}
