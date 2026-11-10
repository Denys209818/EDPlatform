import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { DataSource } from "typeorm";

import { dataSourceOptions } from "./data-source.js";
import { JobType } from "./modules/jobs/job.entity.js";

const JOBS = 40;
const WORKERS = 4;
const JOB_MS = 100;

const RUN_ID = randomUUID();

const dataSource = new DataSource({
  ...dataSourceOptions,
  logging: false,
});

await dataSource.initialize();

// ---------- 1. Наповнення черги ----------
const jobIds: { id: string }[][] = await Promise.all(
  Array.from({ length: JOBS }, (_, i) =>
    dataSource.query('INSERT INTO "tblJobs" (type, payload) VALUES ($1, $2)', [
      JobType.SEND_NOTIFICATION,
      JSON.stringify({ run: RUN_ID, n: i }),
    ]),
  ),
);

// ---------- 2. Воркер ----------

async function worker(name: string): Promise<number> {
  while (true) {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      await queryRunner.query("BEGIN ISOLATION LEVEL READ COMMITTED");

      const [job] = await queryRunner.query(
        `
        SELECT id FROM "tblJobs"
        WHERE status = 'PENDING' AND payload->>'run' = $1
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `,
        [RUN_ID],
      );

      if (job) {
        await sleep(JOB_MS);

        await queryRunner.query(
          `UPDATE "tblJobs" SET status = 'DONE', 
            processed = processed + 1, 
            worker_id = $1, 
            processed_at = now() 
          WHERE id = $2`,
          [name, job.id],
        );
      } else {
        const [availableJobs] = await queryRunner.query(
          `SELECT COUNT(*) FROM "tblJobs" WHERE status = 'PENDING' AND payload->>'run' = $1`,
          [RUN_ID],
        );

        if (availableJobs.count === "0") {
          await queryRunner.query("COMMIT");
          return 0;
        }

        await sleep(JOB_MS);
      }

      await queryRunner.query("COMMIT");
    } catch (error) {
      await queryRunner.query("ROLLBACK");

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// ---------- 3. Запуск воркерів ----------

const startedAt = Date.now();

await Promise.all(
  Array.from({ length: WORKERS }, (_, i) => worker(`w${i + 1}`)),
);

const elapsedMs = Date.now() - startedAt;

// ---------- 4. Результати ----------
const distribution: { worker_id: string | null; count: string }[] =
  await dataSource.query(
    `SELECT worker_id, count(*) FROM "tblJobs"
     WHERE payload->>'run' = $1
     GROUP BY worker_id
     ORDER BY worker_id`,
    [RUN_ID],
  );

const [{ count: processedTwiceRaw }] = await dataSource.query(
  `SELECT count(*) FROM "tblJobs" WHERE payload->>'run' = $1 AND processed > 1`,
  [RUN_ID],
);
const [{ count: notProcessedRaw }] = await dataSource.query(
  `SELECT count(*) FROM "tblJobs" WHERE payload->>'run' = $1 AND status <> 'DONE'`,
  [RUN_ID],
);

const processedTwice = Number(processedTwiceRaw);
const notProcessed = Number(notProcessedRaw);
const sequentialMs = JOBS * JOB_MS;
const activeWorkers = distribution.filter((row) => row.worker_id !== null);

console.log(`Задач: ${JOBS}, воркерів: ${WORKERS}, одна задача: ${JOB_MS} мс`);
console.log("Розподіл по воркерах:");
for (const row of distribution) {
  console.log(`  ${row.worker_id ?? "(ніхто)"}: ${row.count}`);
}
console.log(`оброблено двічі: ${processedTwice}`);
console.log(`не оброблено: ${notProcessed}`);
console.log(
  `Загальний час: ${elapsedMs} мс (послідовно було б ${sequentialMs} мс, ` +
    `прискорення ×${(sequentialMs / elapsedMs).toFixed(1)})`,
);

// ---------- 5. Прибирання ----------
await dataSource.query(`DELETE FROM "tblJobs" WHERE payload->>'run' = $1`, [
  RUN_ID,
]);

await dataSource.destroy();

// ---------- 6. Інваріант ----------
const errors: string[] = [];
if (processedTwice > 0) {
  errors.push(`оброблено двічі: ${processedTwice}`);
}
if (notProcessed > 0) {
  errors.push(`не оброблено: ${notProcessed}`);
}
if (activeWorkers.length < 2) {
  errors.push(
    `задачі обробили лише ${activeWorkers.length} воркер(и), треба ≥ 2`,
  );
}
if (elapsedMs >= sequentialMs) {
  errors.push(
    `час ${elapsedMs} мс не менший за послідовний ${sequentialMs} мс`,
  );
}

if (errors.length > 0) {
  console.error("\nВОРКЕР-ПУЛ НЕЧЕСНИЙ:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("\nOK: кожна задача оброблена рівно один раз, паралельно");
process.exit(0);
