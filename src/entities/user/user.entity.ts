import { Check, Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import { TestEntity } from "../test/test.entity.js";
import { TestUserEntity } from "../test/testUser.entity.js";

@Entity({ name: "tblUsers" })
@Check("CHK_balance_non_negative", '"balance" >= 0')
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

  @Column({
    type: "integer",
    default: 0,
  })
  balance: number;

  @OneToMany((_) => TestEntity, (test) => test.createdBy)
  createdTests: TestEntity[];

  @OneToMany((_) => TestUserEntity, (testUser) => testUser.user)
  testUsers: TestUserEntity[];
}
