import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1792543439224 implements MigrationInterface {
  name = "InitTables1792543439224";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tblUsers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "middle_name" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_807f87ef01c4d85f04e15f4b9f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tblTestUsers" ("test_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_555b166e08032a8fa55ce6fe594" PRIMARY KEY ("test_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tblTaskAnswers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "content" character varying NOT NULL, "task_id" uuid, CONSTRAINT "PK_45cccdac95734e1a663e2469331" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tblTasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "condition" character varying NOT NULL, "test_id" uuid, CONSTRAINT "PK_4f6afe0e13f078ded2e149b8ce5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tblTests_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIEVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tblTests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."tblTests_status_enum" NOT NULL DEFAULT 'DRAFT', CONSTRAINT "PK_d607bf62f2de95e37b2c306be50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_0705c9340b5b94be917fc3c8da5" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_bac8907fdd4547a16ea5742efdc" FOREIGN KEY ("user_id") REFERENCES "tblUsers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTaskAnswers" ADD CONSTRAINT "FK_81d838892758839cf625a78d974" FOREIGN KEY ("task_id") REFERENCES "tblTasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTasks" ADD CONSTRAINT "FK_d560b3a7f6640361166a046519d" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tblTasks" DROP CONSTRAINT "FK_d560b3a7f6640361166a046519d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTaskAnswers" DROP CONSTRAINT "FK_81d838892758839cf625a78d974"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" DROP CONSTRAINT "FK_bac8907fdd4547a16ea5742efdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" DROP CONSTRAINT "FK_0705c9340b5b94be917fc3c8da5"`,
    );
    await queryRunner.query(`DROP TABLE "tblTests"`);
    await queryRunner.query(`DROP TYPE "public"."tblTests_status_enum"`);
    await queryRunner.query(`DROP TABLE "tblTasks"`);
    await queryRunner.query(`DROP TABLE "tblTaskAnswers"`);
    await queryRunner.query(`DROP TABLE "tblTestUsers"`);
    await queryRunner.query(`DROP TABLE "tblUsers"`);
  }
}
