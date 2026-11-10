import { DataSource, type Logger } from "typeorm";

import { dataSourceOptions } from "./data-source.js";
import { TestEntity } from "./entities/test/test.entity.js";
import { TaskEntity } from "./entities/task/task.entity.js";
import { TaskAnswerEntity } from "./entities/task/taskAnswer.entity.js";

let queryCount = 0;

const countingLogger: Logger = {
  logQuery: (query) => {
    queryCount++;
    console.log(
      `  [sql #${queryCount}] ${query.replace(/\s+/g, " ").slice(0, 110)}`,
    );
  },
  logQueryError: () => {},
  logQuerySlow: () => {},
  logSchemaBuild: () => {},
  logMigration: () => {},
  log: () => {},
};

const dataSource = new DataSource({
  ...dataSourceOptions,
  logging: ["query"],
  logger: countingLogger,
});

const results: { strategy: string; queries: number }[] = [];

async function measure(strategy: string, fn: () => Promise<unknown>) {
  console.log(`\n== ${strategy}`);
  queryCount = 0;
  await fn();
  results.push({ strategy, queries: queryCount });
}

await dataSource.initialize();

const testRepo = dataSource.getRepository(TestEntity);
const taskRepo = dataSource.getRepository(TaskEntity);
const answerRepo = dataSource.getRepository(TaskAnswerEntity);

// 1. Наївно: запит на кожен елемент у циклі (N+1)
await measure("naive (query in loop)", async () => {
  const tests = await testRepo.find();
  for (const test of tests) {
    const tasks = await taskRepo.find({ where: { test: { id: test.id } } });
    for (const task of tasks) {
      await answerRepo.find({ where: { task: { id: task.id } } });
    }
  }
});

// 2. Фікс: relations -> один запит із JOIN
await measure("relations (JOIN)", () =>
  testRepo.find({ relations: { tasks: { taskAnswers: true } } }),
);

// 3. Фікс: leftJoinAndSelect -> один запит із JOIN
await measure("leftJoinAndSelect", () =>
  testRepo
    .createQueryBuilder("test")
    .leftJoinAndSelect("test.tasks", "task")
    .leftJoinAndSelect("task.taskAnswers", "answer")
    .getMany(),
);

// 4. relationLoadStrategy: 'query' -> окремий запит на кожен рівень
await measure("relationLoadStrategy: query", () =>
  testRepo.find({
    relations: { tasks: { taskAnswers: true } },
    relationLoadStrategy: "query",
  }),
);

console.log("\n| Стратегія | Кількість запитів |\n|---|---|");
for (const r of results) console.log(`| ${r.strategy} | ${r.queries} |`);

await dataSource.destroy();
