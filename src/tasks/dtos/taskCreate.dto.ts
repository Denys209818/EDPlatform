import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TaskOptionDto } from "./taskOption.dto.js";

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  condition: string;

  @IsString()
  imageUrl: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => TaskOptionDto)
  options: TaskOptionDto[];
}
