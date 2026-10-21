import { Column, Entity, JoinColumn, ManyToOne, type Relation } from "typeorm";
import { TaskEntity } from "./task.entity.js";
import { BaseEntity } from "../base.entity.js";

@Entity({ name: "tblTaskAnswers" })
export class TaskAnswerEntity extends BaseEntity {
  @Column({ type: "varchar" })
  content: string;

  @ManyToOne((_) => TaskEntity, (task) => task.taskAnswers)
  @JoinColumn({ name: "task_id" })
  task: Relation<TaskEntity>;
}
