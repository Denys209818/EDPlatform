import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import { TestUserEntity } from "../test/testUser.entity.js";

@Entity({ name: "tblUsers" })
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

  @OneToMany((_) => TestUserEntity, (testUser) => testUser.user)
  testUsers: TestUserEntity[];
}
