import { DataSource } from "typeorm";
import { dataSourceOptions } from "./data-source.js";
import { TestEntity } from "./entities/test/test.entity.js";

const dataSource = new DataSource({
  ...dataSourceOptions,
});

await dataSource.initialize();

const queryBuilder = dataSource.createQueryBuilder<TestEntity>(TestEntity, "t");

const testRaw = await queryBuilder
  .leftJoin("t.tasks", "task")
  .leftJoin("t.testUsers", "tu")
  .select("t.title", "title")
  .addSelect("COUNT(DISTINCT task.id)", "tasks")
  .addSelect("COUNT(DISTINCT tu.user_id)", "participants")
  .groupBy("t.id")
  .addGroupBy("t.title")
  .orderBy("participants", "DESC")
  .getRawMany();

console.table(testRaw);

await dataSource.destroy();
