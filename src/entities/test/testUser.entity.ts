import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm";
import { TestEntity } from "./test.entity.js";
import { UserEntity } from "../user/user.entity.js";

// Стан проходження тесту учнем (db/schema.sql: status IN ('in_progress','completed','failed'))
export enum TestUserStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Join-таблиця user ↔ test з даними самого зв'язку: стан і номер спроби.
@Entity({ name: "tblTestUsers" })
export class TestUserEntity {
  @PrimaryColumn("uuid")
  test_id: string;

  @PrimaryColumn("uuid")
  user_id: string;

  @Column({
    type: "enum",
    enum: TestUserStatus,
    default: TestUserStatus.IN_PROGRESS,
  })
  status: TestUserStatus;

  @Column({ type: "integer", default: 1 })
  attempt: number;

  @ManyToOne((_) => TestEntity, (test) => test.testUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "test_id" })
  test: Relation<TestEntity>;

  @ManyToOne((_) => UserEntity, (user) => user.testUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: Relation<UserEntity>;
}
