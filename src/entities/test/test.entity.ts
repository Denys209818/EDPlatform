import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";
import { TestUserEntity } from "./testUser.entity.js";
import { BaseEntity } from "../base.entity.js";
import { TaskEntity } from "../task/task.entity.js";
import { UserEntity } from "../user/user.entity.js";

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

  @ManyToOne((_) => UserEntity, (user) => user.createdTests, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "created_by" })
  createdBy: Relation<UserEntity>;

  @OneToMany((_) => TaskEntity, (task) => task.test)
  tasks: TaskEntity[];

  @OneToMany((_) => TestUserEntity, (testUser) => testUser.test)
  testUsers: TestUserEntity[];
}
