import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from '@service/subscription.service';
import { GetSubscriptionRequest, GetUserActiveSubscriptionsRequest, GetUserActiveSubscriptionsResponse, SubscriptionResponse } from '@pb/src/proto/subscription'
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('subscription-service');

@Controller()
export class SubscriptionGrpcController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @GrpcMethod('SubscriptionService', 'GetSubscription')
  async getSubscription(data: GetSubscriptionRequest): Promise<SubscriptionResponse> {
    const span = tracer.startSpan('grpc.GetSubscription');

    try {
      return await context.with(trace.setSpan(context.active(), span), async () => {
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
      });
    } catch (err) {
      span.setStatus({ code: 2 });
      throw err;
    } finally {
      span.end();
    }
  }

  @GrpcMethod('SubscriptionService', 'GetUserActiveSubscriptions')
  async getUserActiveSubscriptions(
    data: GetUserActiveSubscriptionsRequest
  ): Promise<GetUserActiveSubscriptionsResponse> {
    const subs = await this.subscriptionService.findActiveByUserId(data.userId);

    return {
      subscriptions: subs.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        planId: sub.planId,
        status: sub.status,
        currentPeriodStart: {
          seconds: Math.floor(sub.currentPeriodStart.getTime() / 1000),
          nanos: 0,
        },
        currentPeriodEnd: {
          seconds: Math.floor(sub.currentPeriodEnd.getTime() / 1000),
          nanos: 0,
        },
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: {
          seconds: Math.floor(sub.createdAt.getTime() / 1000),
          nanos: 0,
        },
        updatedAt: {
          seconds: Math.floor(sub.updatedAt.getTime() / 1000),
          nanos: 0,
        },
      })),
    };
  }
}
