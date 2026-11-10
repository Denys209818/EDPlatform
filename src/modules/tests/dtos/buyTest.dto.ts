import { IsUUID } from "class-validator";

export class BuyTestDto {
  @IsUUID()
  testId: string;

  @IsUUID()
  userId: string;
}
