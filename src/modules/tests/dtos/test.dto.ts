import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
} from "class-validator";
import { TestStatus } from "../../../entities/test/test.entity.js";

export class TestDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TestStatus)
  status: TestStatus;

  @IsBoolean()
  isPaid: boolean;

  @IsNumber()
  price: number;

  @IsArray()
  taskIds: string[];
}
