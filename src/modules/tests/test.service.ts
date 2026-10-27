import { createHash } from "node:crypto";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CreateTestDto } from "./dtos/testCreate.dto.js";
import { TestDto } from "./dtos/test.dto.js";
import { TestPageDto } from "./dtos/testPage.dto.js";
import { IHashWithResponse } from "./types.js";
import { TestEntity, TestStatus } from "../../entities/test/test.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";

const DEFAULT_LIMIT = 20;

function encodeCursor(lastId: string): string {
  return Buffer.from(lastId, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf8");
}

@Injectable()
export class TestService {
  private readonly idempotencyKeys = new Map<
    string,
    IHashWithResponse<TestDto>
  >();

  constructor(
    @InjectRepository(TestEntity)
    private testRepository: Repository<TestEntity>,
  ) {}

  public async getTests(limit?: string, cursor?: string): Promise<TestPageDto> {
    const parsedLimit = Number(limit);
    const pageSize =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : DEFAULT_LIMIT;

    const entities = await this.testRepository.find({
      where: cursor ? { id: MoreThan(decodeCursor(cursor)) } : {},
      relations: { tasks: true },
      order: { id: "ASC" },
      take: pageSize + 1,
    });

    const hasMore = entities.length > pageSize;
    const items = entities
      .slice(0, pageSize)
      .map((e) => this.convertEntityToDto(e));
    const lastItem = items[items.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.id) : null;

    return { items, next_cursor: nextCursor };
  }

  public async createTest(
    idempotencyKey: string,
    testBody: CreateTestDto,
  ): Promise<TestDto> {
    const bodyHash = this.hashBody(testBody);
    const existing = this.idempotencyKeys.get(idempotencyKey);

    if (existing) {
      if (existing.bodyHash === bodyHash) {
        return existing.response;
      }
      throw new UnprocessableEntityException(
        "idempotency key already used with a different request body",
      );
    }

    const { title, description, isPaid, price } = testBody;

    const saved = await this.testRepository.save(
      this.testRepository.create({
        title,
        description,
        isPaid,
        price: isPaid ? (price ?? 0) : 0,
        status: TestStatus.DRAFT,
      }),
    );

    const response = this.convertEntityToDto({ ...saved, tasks: [] });
    this.idempotencyKeys.set(idempotencyKey, { bodyHash, response });

    return response;
  }

  public async getTestById(testId: string): Promise<TestDto> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: { tasks: true },
    });
    if (!test) {
      throw new NotFoundException(`Test ${testId} not found`);
    }
    return this.convertEntityToDto(test);
  }

  private hashBody(body: CreateTestDto): string {
    return createHash("sha256").update(JSON.stringify(body)).digest("hex");
  }

  private convertEntityToDto(entity: TestEntity): TestDto {
    const { id, title, description, status, isPaid, price, tasks } = entity;

    return {
      id,
      title,
      description,
      status,
      isPaid,
      price,
      taskIds: (tasks ?? []).map((task) => task.id),
    };
  }
}
