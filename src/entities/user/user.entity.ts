import { Column, Entity, Index, OneToMany } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import { TestEntity } from "../test/test.entity.js";
import { TestUserEntity } from "../test/testUser.entity.js";

@Entity({ name: "tblUsers" })
// db/schema.sql: uq_users_email, uq_users_phone
@Index("uq_users_email", ["email"], { unique: true })
@Index("uq_users_phone", ["phone_number"], { unique: true })
export class UserEntity extends BaseEntity {
  @Column({ type: "varchar" })
  first_name: string;

  @Column({ type: "varchar" })
  last_name: string;

  @Column({ type: "varchar" })
  middle_name: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar" })
  phone_number: string;

  @Column({ type: "varchar" })
  password: string;

  @OneToMany((_) => TestEntity, (test) => test.createdBy)
  createdTests: TestEntity[];

  @OneToMany((_) => TestUserEntity, (testUser) => testUser.user)
  testUsers: TestUserEntity[];
}
