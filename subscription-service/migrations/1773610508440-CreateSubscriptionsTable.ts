import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionsTable1773610508440 implements MigrationInterface {
    name = 'CreateSubscriptionsTable1773610508440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" text NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL, "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    }

}
