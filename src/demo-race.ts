import { DataSource } from "typeorm";

import { dataSourceOptions } from "./data-source.js";
import { checkout } from "./modules/tests/checkout.js";

const SEATS = 10;
const ATTEMPTS = 50;
const PRICE = 10;
const BALANCE = 1_000;

const dataSource = new DataSource({
  ...dataSourceOptions,
  logging: false,
  extra: { max: 60 },
});

await dataSource.initialize();

// ---------- 1. Підготовка даних ----------
const [test] = await dataSource.query(
  `INSERT INTO "tblTests" (title, description, "isPaid", price, seats_left) VALUES ('test1', 'test1 description', true, $1, $2) RETURNING id`,
  [PRICE, SEATS],
);

const createdUsers: { id: string }[][] = await Promise.all(
  Array.from({ length: ATTEMPTS }, (_, i) =>
    dataSource.query(
      `INSERT INTO "tblUsers"
         (first_name, last_name, middle_name, email, phone_number, password, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        `Race${i}`,
        `User${i}`,
        `Middle${i}`,
        `race${i}@test.com`,
        `+38000000${String(i).padStart(4, "0")}`,
        `password${i}`,
        BALANCE,
      ],
    ),
  ),
);

const userIds = createdUsers.map(([user]) => user.id);

// ---------- 2. Гонка ----------

const checkoutResults = await Promise.allSettled(
  Array.from({ length: ATTEMPTS }, (_, i) =>
    checkout(dataSource, userIds[i], test.id),
  ),
);

// ---------- 3. Результати ----------
const [test_with_seats_left] = await dataSource.query(
  'SELECT seats_left FROM "tblTests" WHERE id = $1',
  [test.id],
);

const [seats_left_lower_zero] = await dataSource.query(
  'SELECT count(*) FROM "tblTests" WHERE seats_left < 0',
);

console.log("Спроб: ", ATTEMPTS);
console.log(
  "Успішних cпроб: ",
  checkoutResults.filter((att) => att.status === "fulfilled").length,
);

console.log(
  "Фінальний seats_left цього тесту: ",
  test_with_seats_left.seats_left,
);
console.log("Рядків із відʼємним seats_left: ", seats_left_lower_zero.count);

// ---------- 4. Прибирання ----------
await dataSource.query(`DELETE FROM "tblJobs" WHERE payload->>'testId' = $1`, [
  test.id,
]);
await dataSource.query(`DELETE FROM "tblTests" WHERE id = $1`, [test.id]);
await dataSource.query(`DELETE FROM "tblUsers" WHERE id = ANY($1)`, [userIds]);

await dataSource.destroy();

// ---------- 5. Інваріант ----------
const successCount = checkoutResults.filter(
  (r) => r.status === "fulfilled",
).length;
const finalSeatsLeft = test_with_seats_left.seats_left;
const negativeCount = Number(seats_left_lower_zero.count); // count(*) приходить рядком

const errors: string[] = [];
if (successCount !== SEATS) {
  errors.push(`успішних ${successCount}, очікувалось ${SEATS}`);
}
if (finalSeatsLeft !== 0) {
  errors.push(`фінальний seats_left ${finalSeatsLeft}, очікувалось 0`);
}
if (negativeCount > 0) {
  errors.push(`рядків із відʼємним seats_left: ${negativeCount}`);
}

if (errors.length > 0) {
  console.error("\n ІНВАРІАНТ ПОРУШЕНО (oversell):");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("\n OK: oversell немає");
process.exit(0);
