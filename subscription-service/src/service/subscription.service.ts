import { Injectable } from '@nestjs/common';
import { CreateSubscriptionInput } from '@dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@dtos/update-subscription.dto';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { SubscriptionMapper } from '@mapper/subscription.mapper';
import { SubscriptionRepository } from 'src/repository/subscription.repository';

@Injectable()
export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async findById(id: string): Promise<SubscriptionEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new Error(`Subscription with id ${id} not found`);
    }
    return entity;
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const entity = SubscriptionMapper.toRequest(input);
    return this.repository.createAndSave(entity);
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<SubscriptionEntity> {
    return this.repository.update(id, input);
  }
}
