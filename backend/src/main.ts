import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module.js";
import { getAppConfig } from "./config/getAppConfig.js";

async function bootstrap() {
  const config = getAppConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useBodyParser("json", { limit: config.requestBodyLimit });
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
  });

  await app.listen(config.port);
}

void bootstrap();
