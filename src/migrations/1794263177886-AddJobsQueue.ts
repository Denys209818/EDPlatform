import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobsQueue1794263177886 implements MigrationInterface {
  name = "AddJobsQueue1794263177886";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tblJobs_status_enum" AS ENUM('PENDING', 'DONE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tblJobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "payload" jsonb NOT NULL, "status" "public"."tblJobs_status_enum" NOT NULL DEFAULT 'PENDING', "processed" integer NOT NULL DEFAULT '0', "worker_id" character varying, "last_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7c35c523dc5852d3d7d80de17fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_pending" ON "tblJobs" ("created_at") WHERE "status" = 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_pending"`);
    await queryRunner.query(`DROP TABLE "tblJobs"`);
    await queryRunner.query(`DROP TYPE "public"."tblJobs_status_enum"`);
  }
}
