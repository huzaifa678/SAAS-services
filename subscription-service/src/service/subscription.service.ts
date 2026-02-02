import { Injectable } from '@nestjs/common';
import { CreateSubscriptionInput } from '@dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@dtos/update-subscription.dto';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { SubscriptionMapper } from '@mapper/subscription.mapper';

@Injectable()
export class SubscriptionService {
  private subscriptions: SubscriptionEntity[] = [];

  async findById(id: string): Promise<SubscriptionEntity> {
    return this.subscriptions.find(sub => sub.id === id) as SubscriptionEntity;
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const entity = SubscriptionMapper.toRequest(input);
    this.subscriptions.push(entity);
    return entity;
  }

  async update(
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionEntity> {
    const index = this.subscriptions.findIndex(sub => sub.id === id);
    if (index === -1) throw new Error('Subscription not found');

    const existing = this.subscriptions[index];
    const updated: SubscriptionEntity = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    this.subscriptions[index] = updated;
    return updated;
  }
}
