import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNumber,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
} from "class-validator";

export class CreateTestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  isPaid: boolean;

  @ValidateIf((o) => o.isPaid === true)
  @IsDefined()
  @IsNumber()
  @Min(0)
  price?: number;
}
