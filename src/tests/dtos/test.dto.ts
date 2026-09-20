import { IsArray, IsString, IsUrl } from "class-validator";

export class TestDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUrl()
  imageUrl: string;

  @IsArray()
  taskIds: string[];
}
