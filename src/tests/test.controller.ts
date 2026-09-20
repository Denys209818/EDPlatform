import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { CreateTestDto } from "./dtos/testCreate.dto.js";
import { TestDto } from "./dtos/test.dto.js";
import { TestPageDto } from "./dtos/testPage.dto.js";
import { TestService } from "./test.service.js";

@Controller("tests")
export class TestController {
  constructor(private readonly _testService: TestService) {}

  @Get()
  public async getTests(
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ): Promise<TestPageDto> {
    return this._testService.getTests(limit, cursor);
  }

  @Post()
  public async createTest(
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() testBody: CreateTestDto,
  ): Promise<TestDto> {
    return this._testService.createTest(idempotencyKey, testBody);
  }
}
