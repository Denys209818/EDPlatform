import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.js";
import { ConfigService } from "@nestjs/config";
import { Env } from "./config/env.schema.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableShutdownHooks();

  // infer: true makes nest to look into Env to define type
  await app.listen(config.get("PORT", { infer: true }));
}

await bootstrap();
