import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTestUserProgressAndUserUniques1794274126825 implements MigrationInterface {
  name = "AddTestUserProgressAndUserUniques1794274126825";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tblTestUsers_status_enum" AS ENUM('in_progress', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD "status" "public"."tblTestUsers_status_enum" NOT NULL DEFAULT 'in_progress'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD "attempt" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_phone" ON "tblUsers" ("phone_number") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email" ON "tblUsers" ("email") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_phone"`);
    await queryRunner.query(`ALTER TABLE "tblTestUsers" DROP COLUMN "attempt"`);
    await queryRunner.query(`ALTER TABLE "tblTestUsers" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."tblTestUsers_status_enum"`);
  }
}
