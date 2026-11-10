import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { type DataSource } from "typeorm";
import { TestEntity } from "../../entities/test/test.entity.js";
import { JobType } from "../jobs/job.entity.js";

export async function checkout(
  dataSource: DataSource,
  userId: string,
  testId: string,
): Promise<TestEntity> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query("BEGIN ISOLATION LEVEL READ COMMITTED");

    const [user] = await queryRunner.query(
      'SELECT balance FROM "tblUsers" WHERE id = $1 FOR UPDATE',
      [userId],
    );
    if (!user) {
      throw new NotFoundException("User with this id does not exist");
    }

    const [lockedTest] = await queryRunner.query(
      'SELECT seats_left, "isPaid", price FROM "tblTests" WHERE id = $1 FOR UPDATE',
      [testId],
    );

    if (!lockedTest) {
      throw new NotFoundException("Test with this id does not exist");
    }

    if (lockedTest.seats_left !== null && lockedTest.seats_left < 1) {
      throw new ConflictException("No seats left for this test");
    }

    await queryRunner.query(
      'UPDATE "tblTests" SET seats_left = seats_left - 1 WHERE id = $1',
      [testId],
    );

    if (lockedTest.isPaid) {
      if (user.balance < lockedTest.price) {
        throw new BadRequestException(
          "User does not have enough money to buy test",
        );
      }

      await queryRunner.query(
        'UPDATE "tblUsers" SET balance = balance - $1 WHERE id = $2',
        [lockedTest.price, userId],
      );
    }

    const inserted = await queryRunner.query(
      `INSERT INTO "tblTestUsers" (test_id, user_id) VALUES ($1, $2)
       ON CONFLICT (test_id, user_id) DO NOTHING
       RETURNING test_id`,
      [testId, userId],
    );

    if (inserted.length === 0) {
      throw new ConflictException("User has already bought this test");
    }

    await queryRunner.query(
      `INSERT INTO "tblJobs" (type, payload) VALUES ($1, $2)`,
      [
        JobType.SEND_NOTIFICATION,
        JSON.stringify({ event: "test_purchased", userId, testId }),
      ],
    );

    const test = await queryRunner.manager.findOne(TestEntity, {
      where: { id: testId },
      relations: { tasks: true },
    });

    await queryRunner.query("COMMIT");

    return test!;
  } catch (error) {
    await queryRunner.query("ROLLBACK");
    throw error;
  } finally {
    await queryRunner.release();
  }
}
