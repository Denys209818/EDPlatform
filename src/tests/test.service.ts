import { randomUUID, createHash } from "node:crypto";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CreateTestDto } from "./dtos/testCreate.dto.js";
import { TestDto } from "./dtos/test.dto.js";
import { TestPageDto } from "./dtos/testPage.dto.js";
import { IHashWithResponse } from "./types.js";

const DEFAULT_LIMIT = 20;

function encodeCursor(lastId: string): string {
  return Buffer.from(lastId, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf8");
}

@Injectable()
export class TestService {
  private readonly tests: TestDto[] = [];
  private readonly idempotencyKeys = new Map<
    string,
    IHashWithResponse<TestDto>
  >();

  public async getTests(limit?: string, cursor?: string): Promise<TestPageDto> {
    const parsedLimit = Number(limit);
    const pageSize =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : DEFAULT_LIMIT;
    const startIndex = cursor
      ? this.tests.findIndex((t) => t.id === decodeCursor(cursor)) + 1
      : 0;

    const items = this.tests.slice(startIndex, startIndex + pageSize);
    const lastItem = items[items.length - 1];
    const nextCursor =
      startIndex + pageSize < this.tests.length && lastItem
        ? encodeCursor(lastItem.id)
        : null;

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

    const test: TestDto = { id: randomUUID(), ...testBody };
    this.tests.push(test);
    this.idempotencyKeys.set(idempotencyKey, { bodyHash, response: test });

    return test;
  }

  public async getTestById(testId: string): Promise<TestDto> {
    const test = this.tests.find((t) => t.id === testId);
    if (!test) {
      throw new NotFoundException(`Test ${testId} not found`);
    }
    return test;
  }

  private hashBody(body: Omit<TestDto, "id">): string {
    return createHash("sha256").update(JSON.stringify(body)).digest("hex");
  }
}
