// npm run demo:retry
// Провокуємо serialization failure (40001): кілька транзакцій під REPEATABLE READ
// одночасно роблять read-modify-write одного балансу. withRetry ловить 40001
// і повторює транзакцію цілком. Фінальний баланс має зійтись арифметично.
import { setTimeout as sleep } from "node:timers/promises";
import { DataSource } from "typeorm";

import { dataSourceOptions } from "./data-source.js";
import { withRetry } from "./modules/database/with-retry.js";

const TRANSACTIONS = 10; // скільки паралельних поповнень
const AMOUNT = 10; // на скільки кожне поповнює баланс
const START_BALANCE = 0;
const EXPECTED = START_BALANCE + TRANSACTIONS * AMOUNT; // 100

const dataSource = new DataSource({
  ...dataSourceOptions,
  logging: false,
});

await dataSource.initialize();

// ---------- 1. Підготовка ----------
const [{ id: createdUserId }] = await dataSource.query(
  `INSERT INTO "tblUsers"
         (first_name, last_name, middle_name, email, phone_number, password, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
  [
    `Race1`,
    `User1`,
    `Middle1`,
    `race1@test.com`,
    `+380000001234`,
    `password1`,
    START_BALANCE,
  ],
);

// ---------- 2. Одна транзакція поповнення ----------
async function topUp(userId: string): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  try {
    await queryRunner.query("BEGIN ISOLATION LEVEL REPEATABLE READ");

    const [userWithBalance] = await queryRunner.query(
      'SELECT balance FROM "tblUsers" WHERE id = $1',
      [userId],
    );

    const { balance } = userWithBalance;

    await sleep(20);

    await queryRunner.query(
      'UPDATE "tblUsers" SET balance = $1 WHERE id = $2',
      [balance + AMOUNT, userId],
    );

    await queryRunner.query("COMMIT");
  } catch (error) {
    await queryRunner.query("ROLLBACK");
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ---------- 3. Запуск ----------

let retries = 0;

await Promise.all(
  Array.from({ length: TRANSACTIONS }, () =>
    withRetry(() => topUp(createdUserId), { onRetry: () => retries++ }),
  ),
);

// ---------- 4. Результат ----------

const [user] = await dataSource.query(
  `SELECT balance FROM "tblUsers" WHERE id = $1`,
  [createdUserId],
);

console.log(`очікувано ${EXPECTED}, фактично ${user.balance}`);
console.log(`кількість retry ${retries}`);

// ---------- 5. Прибирання ----------

await dataSource.query(`DELETE FROM "tblUsers" WHERE id = $1`, [createdUserId]);

await dataSource.destroy();

// ---------- 6. Інваріант ----------

// Баланс має зійтись арифметично, і хоча б один 40001/40P01 має бути спійманий.

const errors: string[] = [];
if (user.balance !== EXPECTED) {
  errors.push(
    `баланс ${user.balance}, очікувалось ${EXPECTED} — загублено ${
      (EXPECTED - user.balance) / AMOUNT
    } поповнень`,
  );
}
if (retries === 0) {
  errors.push(
    "жодного retry: конфлікт (40001/40P01) не спровокувався, демо нічого не показало",
  );
}

if (errors.length > 0) {
  console.error("\n❌ RETRY НЕ СПРАЦЮВАВ:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `\n✅ OK: ${TRANSACTIONS} поповнень по ${AMOUNT} → ${user.balance}, ` +
    `спіймано й повторено ${retries} конфліктів`,
);
process.exit(0);
