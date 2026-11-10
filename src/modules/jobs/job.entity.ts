import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum JobStatus {
  PENDING = "PENDING",
  DONE = "DONE",
  FAILED = "FAILED",
}

// Типи фонових задач. varchar у БД, тож новий тип не потребує міграції.
export enum JobType {
  SEND_NOTIFICATION = "send_notification",
}

// Черга фонових задач: checkout вставляє, воркери розбирають через FOR UPDATE SKIP LOCKED.
@Entity({ name: "tblJobs" })
@Index("IDX_jobs_pending", ["created_at"], { where: `"status" = 'PENDING'` })
export class JobEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  type: JobType;

  @Column({ type: "jsonb" })
  payload: Record<string, unknown>;

  @Column({ type: "enum", enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Column({ type: "integer", default: 0 })
  processed: number;

  @Column({ type: "varchar", nullable: true })
  worker_id: string | null;

  @Column({ type: "text", nullable: true })
  last_error: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  processed_at: Date | null;
}
