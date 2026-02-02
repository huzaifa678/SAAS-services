import { Module } from '@nestjs/common';
import { SubscriptionResolver } from '@resolvers/subscription.resolver';
import { SubscriptionService } from '@service/subscription.service';

@Module({
  providers: [SubscriptionService, SubscriptionResolver],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

