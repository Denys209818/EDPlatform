import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldSeatsLeft1794262635649 implements MigrationInterface {
  name = "AddFieldSeatsLeft1794262635649";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tblTests" ADD "seats_left" integer`);
    await queryRunner.query(
      `ALTER TABLE "tblTests" ADD CONSTRAINT "CHK_seats_left_non_negative" CHECK ("seats_left" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tblTests" DROP CONSTRAINT "CHK_seats_left_non_negative"`,
    );
    await queryRunner.query(`ALTER TABLE "tblTests" DROP COLUMN "seats_left"`);
  }
}
