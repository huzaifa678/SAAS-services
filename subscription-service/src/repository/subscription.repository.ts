import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SubscriptionEntity } from '@model/entities/subscription.entity';
import { SubscriptionStatus } from '@model/domain/subscription-status.enum';

@Injectable()
export class SubscriptionRepository implements OnApplicationShutdown {
  private readonly logger = new Logger(SubscriptionRepository.name);
  
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repo: Repository<SubscriptionEntity>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findActiveByUserId(userId: string) {
    return this.repo.find({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE, 
      },
    });
  }

  createAndSave(subscription: SubscriptionEntity) {
    return this.repo.save(subscription);
  }

  update(id: string, updateData: Partial<SubscriptionEntity>) {
    return this.repo.save({ id, ...updateData });
  }

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Shutdown signal received: ${signal}`);

    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('TypeORM DataSource closed gracefully');
    }
  }
}
