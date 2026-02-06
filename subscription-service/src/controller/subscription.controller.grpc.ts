import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from '@service/subscription.service';
import { GetSubscriptionRequest, SubscriptionResponse } from '@pb/src/proto/subscription'

@Controller()
export class SubscriptionGrpcController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @GrpcMethod('SubscriptionService', 'GetSubscription')
  async getSubscription(data: GetSubscriptionRequest): Promise<SubscriptionResponse> {
    const sub = await this.subscriptionService.findById(data.subscriptionId);
    return {
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      status: sub.status,
      currentPeriodStart: {
          seconds: Math.floor(sub.currentPeriodStart.getTime() / 1000),
          nanos: 0
      },
      currentPeriodEnd: {
          seconds: Math.floor(sub.currentPeriodEnd.getTime() / 1000),
          nanos: 0
      },
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      createdAt: {
          seconds: Math.floor(sub.createdAt.getTime() / 1000),
          nanos: 0
      },
      updatedAt: {
          seconds: Math.floor(sub.updatedAt.getTime() / 1000),
          nanos: 0
      },
    };
  }
}
