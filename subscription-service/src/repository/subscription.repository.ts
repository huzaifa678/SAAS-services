import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '@entities/subscription.entity';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repo: Repository<SubscriptionEntity>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  createAndSave(subscription: SubscriptionEntity) {
    return this.repo.save(subscription);
  }

  update(id: string, updateData: Partial<SubscriptionEntity>) {
    return this.repo.save({ id, ...updateData });
  }
}
