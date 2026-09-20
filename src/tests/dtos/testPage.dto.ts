import { TestDto } from "./test.dto.js";

export class TestPageDto {
  items: TestDto[];
  next_cursor: string | null;
}
