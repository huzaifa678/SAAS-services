import { SubscriptionStatus } from "@model/domain/subscription-status.enum";
import { Field, GraphQLISODateTime, ObjectType, ID, registerEnumType } from "@nestjs/graphql";

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus', 
});

@ObjectType('Subscription')
export class SubscriptionEntity {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  planId!: string;

  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => GraphQLISODateTime)
  currentPeriodStart!: Date;

  @Field(() => GraphQLISODateTime)
  currentPeriodEnd!: Date;

  @Field()
  cancelAtPeriodEnd!: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
