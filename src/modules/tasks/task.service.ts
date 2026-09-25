import { v4 as uuidv4 } from "uuid";

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CreateTaskDto } from "./dtos/taskCreate.dto.js";
import { IHashWithResponse } from "./types.js";
import { TaskDto } from "./dtos/task.dto.js";
import { TaskPageDto } from "./dtos/taskPage.dto.js";
import { createHash } from "node:crypto";

const DEFAULT_LIMIT = 20;

function encodeCursor(lastId: string): string {
  return Buffer.from(lastId, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf8");
}

@Injectable()
export class TaskService {
  private readonly tasks: TaskDto[] = [];
  private idempotencyKeys = new Map<string, IHashWithResponse<TaskDto>>();

  public async getTasks(limit?: string, cursor?: string): Promise<TaskPageDto> {
    const parsedLimit = Number(limit);
    const pageSize =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : DEFAULT_LIMIT;
    const startIndex = cursor
      ? this.tasks.findIndex((t) => t.id === decodeCursor(cursor)) + 1
      : 0;

    const items = this.tasks.slice(startIndex, startIndex + pageSize);
    const lastItem = items[items.length - 1];
    const nextCursor =
      startIndex + pageSize < this.tasks.length && lastItem
        ? encodeCursor(lastItem.id)
        : null;

    return { items, next_cursor: nextCursor };
  }

  // Article: https://greenmonkii.medium.com/implementing-idempotency-in-backend-systems-270657c546cb
  public async createTask(
    idempotencyKey: string,
    taskBody: CreateTaskDto,
  ): Promise<TaskDto> {
    const value = idempotencyKey
      ? this.idempotencyKeys.get(idempotencyKey)
      : undefined;

    if (idempotencyKey && value) {
      if (this.hashBody(taskBody) === value.bodyHash) {
        return value.response;
      }

      throw new UnprocessableEntityException(
        "The entity is already processing",
      );
    }

    const newTask: TaskDto = {
      id: uuidv4(),
      title: taskBody.title,
      condition: taskBody.condition,
      imageUrl: taskBody.imageUrl,
      options: taskBody.options,
    };

    if (!idempotencyKey) {
      throw new BadRequestException("No Idempotency Key provided");
    }

    const hashWithResponse: IHashWithResponse<TaskDto> = {
      bodyHash: this.hashBody(taskBody),
      response: newTask,
    };

    this.idempotencyKeys.set(idempotencyKey, hashWithResponse);
    this.tasks.push(newTask);

    return hashWithResponse.response;
  }

  public async getTaskById(taskId: string): Promise<TaskDto> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return task;
  }

  public hashBody(body: Omit<TaskDto, "id">): string {
    return createHash("sha256").update(JSON.stringify(body)).digest("hex");
  }
}
