import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { CreateTaskDto } from "./dtos/taskCreate.dto.js";
import { TaskDto } from "./dtos/task.dto.js";
import { TaskPageDto } from "./dtos/taskPage.dto.js";
import { TaskService } from "./task.service.js";

@Controller("tasks")
export class TaskController {
  constructor(private readonly _taskService: TaskService) {}

  @Get()
  public async getTasks(
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ): Promise<TaskPageDto> {
    return this._taskService.getTasks(limit, cursor);
  }

  @Post()
  public async createTask(
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() taskBody: CreateTaskDto,
  ): Promise<TaskDto> {
    return this._taskService.createTask(idempotencyKey, taskBody);
  }

  @Get(":taskId")
  public async getTaskById(@Param("taskId") taskId: string): Promise<TaskDto> {
    return this._taskService.getTaskById(taskId);
  }
}
