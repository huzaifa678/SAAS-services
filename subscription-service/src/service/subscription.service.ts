import { Injectable, Logger, OnApplicationShutdown, ServiceUnavailableException } from '@nestjs/common';
import { CreateSubscriptionInput } from '@model/dtos/create-subscription.dto';
import { UpdateSubscriptionInput } from '@model/dtos/update-subscription.dto';
import { SubscriptionEntity } from '@model/entities/subscription.entity';
import { SubscriptionMapper } from '@mapper/subscription.mapper';
import { SubscriptionRepository } from '../repository/subscription.repository';
import { CircuitBreakerService } from '@service/circuit-breaker.service';

@Injectable()
export class SubscriptionService implements OnApplicationShutdown {
  private readonly logger = new Logger(SubscriptionService.name);
  private findByIdBreaker;
  private createBreaker;

  constructor(
    private readonly repository: SubscriptionRepository,
    private readonly breakerService: CircuitBreakerService,
  ) {
    this.findByIdBreaker = this.breakerService.create(
      (id: string) => this.repository.findById(id),
      undefined,
      (id: string) => {
        throw new ServiceUnavailableException(
          `Subscription service unavailable while fetching ${id}`,
        );
      },
    );

    this.createBreaker = this.breakerService.create(
      (input: CreateSubscriptionInput) =>
        this.repository.createAndSave(
          SubscriptionMapper.toRequest(input),
        ),
      undefined,
      () => {
        throw new ServiceUnavailableException(
          'Subscription service unavailable while creating subscription',
        );
      },
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

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutdown signal received: ${signal}`);

    try {
      if (this.findByIdBreaker) {
        this.findByIdBreaker.shutdown();
        this.logger.log('findByIdBreaker shutdown completed');
      }
      if (this.createBreaker) {
        this.createBreaker.shutdown();
        this.logger.log('createBreaker shutdown completed');
      }
    } catch (err) {
      this.logger.error('Error during circuit breaker shutdown', err);
    }
  }
}
