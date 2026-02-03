import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionResolver } from '@resolvers/subscription.resolver';
import { SubscriptionService } from '@service/subscription.service';
import { CircuitBreakerService } from '@service/circuit-breaker.service';
import { SubscriptionEntity } from '@model/entities/subscription.entity';
import { SubscriptionRepository } from './repository/subscription.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity]),
  ],
  providers: [
    SubscriptionService,
    SubscriptionResolver,
    CircuitBreakerService,
    SubscriptionRepository, 
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

