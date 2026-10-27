import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from "typeorm";
import { TestEntity } from "./test.entity.js";
import { UserEntity } from "../user/user.entity.js";

@Entity({ name: "tblTestUsers" })
export class TestUserEntity {
  @PrimaryColumn("uuid")
  test_id: string;

  @PrimaryColumn("uuid")
  user_id: string;

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
