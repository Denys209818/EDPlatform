import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../../entities/user/user.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
})
export class UserModule {}
