import { Module } from "@nestjs/common";
import { TestController } from "./test.controller.js";
import { TestService } from "./test.service.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TestEntity } from "../../entities/test/test.entity.js";
import { TestUserEntity } from "../../entities/test/testUser.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([TestEntity, TestUserEntity])],
  controllers: [TestController],
  providers: [TestService],
})
export class TestModule {}
