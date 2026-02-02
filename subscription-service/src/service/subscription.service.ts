import { Injectable } from '@nestjs/common';
import { CreateSubscriptionInput } from '@dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@dtos/update-subscription.dto';
import { SubscriptionEntity } from '@entities/subscription.entity';
import { SubscriptionMapper } from '@mapper/subscription.mapper';
import { SubscriptionRepository } from 'src/repository/subscription.repository';
import { CircuitBreakerService } from './circuit-breaker.service';

@Injectable()
export class SubscriptionService {

  private findByIdBreaker;
  private createBreaker;

  constructor(
    private readonly repository: SubscriptionRepository,
    private readonly breakerService: CircuitBreakerService,
  ) {
    this.findByIdBreaker = this.breakerService.create(
      (id: string) => this.repository.findById(id),
    );

    this.createBreaker = this.breakerService.create(
      (input: CreateSubscriptionInput) =>
        this.repository.createAndSave(SubscriptionMapper.toRequest(input)),
    );
  }

  async findById(id: string): Promise<SubscriptionEntity> {
    const result = await this.findByIdBreaker.fire(id);
    if (!result) throw new Error('Subscription not found (circuit breaker fallback)');
    return result;
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
   const result = await this.createBreaker.fire(input);
    if (!result) throw new Error('Failed to create subscription (circuit breaker fallback)');
    return result;
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<SubscriptionEntity> {
    return this.repository.update(id, input);
  }
}
