import { Column, Entity, OneToMany } from "typeorm";
import { TestUserEntity } from "./testUser.entity.js";
import { BaseEntity } from "../base.entity.js";
import { TaskEntity } from "../task/task.entity.js";

export enum TestStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIEVED = "ARCHIEVED",
}

@Entity({ name: "tblTests" })
export class TestEntity extends BaseEntity {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  description: string;

  @Column({
    type: "enum",
    enum: TestStatus,
    default: TestStatus.DRAFT,
  })
  status: TestStatus;

  @OneToMany((_) => TaskEntity, (task) => task.test)
  tasks: TaskEntity[];

  @OneToMany((_) => TestUserEntity, (testUser) => testUser.test)
  testUsers: TestUserEntity[];
}
