import { Module } from "@nestjs/common";
import { TaskController } from "./task.controller.js";
import { TaskService } from "./task.service.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskEntity } from "../../entities/task/task.entity.js";
import { TaskAnswerEntity } from "../../entities/task/taskAnswer.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, TaskAnswerEntity])],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
