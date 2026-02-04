import { Module } from '@nestjs/common';
import { SubscriptionEventsProducer } from './events/subscription.event.producer'

@Module({
  providers: [SubscriptionEventsProducer],
  exports: [SubscriptionEventsProducer],
})
export class KafkaModule {}
