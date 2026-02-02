import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { SubscriptionModule } from './subscription.module';

@Module({
  imports: [
    SubscriptionModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver, 
      autoSchemaFile: join(process.cwd(), 'src/schema/schema.gql'),
      sortSchema: true, 
      playground: true, 
    }),
  ],
})
export class AppModule {}

