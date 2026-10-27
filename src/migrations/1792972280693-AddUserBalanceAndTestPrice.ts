import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBalanceAndTestPrice1792972280693 implements MigrationInterface {
    name = 'AddUserBalanceAndTestPrice1792972280693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tblUsers" ADD "balance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tblTests" ADD "isPaid" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tblTests" ADD "price" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tblUsers" ADD CONSTRAINT "CHK_balance_non_negative" CHECK ("balance" >= 0)`);
        await queryRunner.query(`ALTER TABLE "tblTests" ADD CONSTRAINT "CHK_price_non_negative" CHECK ("price" >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tblTests" DROP CONSTRAINT "CHK_price_non_negative"`);
        await queryRunner.query(`ALTER TABLE "tblUsers" DROP CONSTRAINT "CHK_balance_non_negative"`);
        await queryRunner.query(`ALTER TABLE "tblTests" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "tblTests" DROP COLUMN "isPaid"`);
        await queryRunner.query(`ALTER TABLE "tblUsers" DROP COLUMN "balance"`);
    }

}
