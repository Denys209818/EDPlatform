import { TaskDto } from "./task.dto.js";

export class TaskPageDto {
  items: TaskDto[];
  next_cursor: string | null;
}
