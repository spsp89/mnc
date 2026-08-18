import "reflect-metadata";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 4000);
  const webOrigin = config.get<string>("WEB_ORIGIN", "http://localhost:3000");

  // The production topology has one trusted reverse proxy in front of the API.
  // This lets the global throttler use the original client address instead of
  // applying one shared quota to every request received through that proxy.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.enableCors({
    origin: webOrigin.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  const openApiConfig = new DocumentBuilder()
    .setTitle("BNC Platform API")
    .setDescription("Versioned APIs for BNC web, Android and iOS clients.")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("health")
    .addTag("auth")
    .addTag("businesses")
    .addTag("search")
    .addTag("leads")
    .addTag("admin")
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "BNC API documentation",
  });

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
