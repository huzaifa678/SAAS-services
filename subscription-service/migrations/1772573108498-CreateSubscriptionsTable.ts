import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionsTable1772573108498 implements MigrationInterface {
    name = 'CreateSubscriptionsTable1772573108498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "planId"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "planId" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "planId"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "planId" uuid NOT NULL`);
    }

}
