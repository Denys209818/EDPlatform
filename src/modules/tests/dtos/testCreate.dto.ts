import { IsArray, IsString, IsUrl } from "class-validator";

export class CreateTestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUrl()
  imageUrl: string;

  @IsArray()
  taskIds: string[];
}
