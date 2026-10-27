import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeleteRules1793132454834 implements MigrationInterface {
  name = "AddDeleteRules1793132454834";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" DROP CONSTRAINT "FK_0705c9340b5b94be917fc3c8da5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" DROP CONSTRAINT "FK_bac8907fdd4547a16ea5742efdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTaskAnswers" DROP CONSTRAINT "FK_81d838892758839cf625a78d974"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTasks" DROP CONSTRAINT "FK_d560b3a7f6640361166a046519d"`,
    );
    await queryRunner.query(`ALTER TABLE "tblTests" ADD "created_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_0705c9340b5b94be917fc3c8da5" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_bac8907fdd4547a16ea5742efdc" FOREIGN KEY ("user_id") REFERENCES "tblUsers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTaskAnswers" ADD CONSTRAINT "FK_81d838892758839cf625a78d974" FOREIGN KEY ("task_id") REFERENCES "tblTasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTasks" ADD CONSTRAINT "FK_d560b3a7f6640361166a046519d" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTests" ADD CONSTRAINT "FK_1559dd9a2f913f3280bd0ef9c97" FOREIGN KEY ("created_by") REFERENCES "tblUsers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tblTests" DROP CONSTRAINT "FK_1559dd9a2f913f3280bd0ef9c97"`,
    );
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
    await queryRunner.query(`ALTER TABLE "tblTests" DROP COLUMN "created_by"`);
    await queryRunner.query(
      `ALTER TABLE "tblTasks" ADD CONSTRAINT "FK_d560b3a7f6640361166a046519d" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTaskAnswers" ADD CONSTRAINT "FK_81d838892758839cf625a78d974" FOREIGN KEY ("task_id") REFERENCES "tblTasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_bac8907fdd4547a16ea5742efdc" FOREIGN KEY ("user_id") REFERENCES "tblUsers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tblTestUsers" ADD CONSTRAINT "FK_0705c9340b5b94be917fc3c8da5" FOREIGN KEY ("test_id") REFERENCES "tblTests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
