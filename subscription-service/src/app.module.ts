import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { SubscriptionModule } from './subscription.module.js';
import { SubscriptionEntity } from '@model/entities/subscription.entity'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { KafkaModule } from './kafka.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5433'),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [SubscriptionEntity],
      synchronize: true, 
      logging: true,
      extra: {
        max: 10,
      },
    }),
    TypeOrmModule.forFeature([SubscriptionEntity]), 
    SubscriptionModule,
    KafkaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      path: '/api/subscription/',
    }),
  ],
})
export class AppModule {}


