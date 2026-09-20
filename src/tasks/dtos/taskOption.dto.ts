import { IsBoolean, IsString } from "class-validator";

export class TaskOptionDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}
