import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";
import { BaseEntity } from "../base.entity.js";
import { TaskAnswerEntity } from "./taskAnswer.entity.js";
import { TestEntity } from "../test/test.entity.js";

@Entity({ name: "tblTasks" })
export class TaskEntity extends BaseEntity {
  @Column({ type: "varchar" })
  condition: string;

  @ManyToOne((_) => TestEntity, (test) => test.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "test_id" })
  test: Relation<TestEntity>;

  @OneToMany((_) => TaskAnswerEntity, (test) => test.task)
  taskAnswers: TaskAnswerEntity[];
}
