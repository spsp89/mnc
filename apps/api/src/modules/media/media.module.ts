import { S3Client } from "@aws-sdk/client-s3";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { MediaController } from "./media.controller";
import { MediaService, OBJECT_STORAGE_CLIENT } from "./media.service";

@Global()
@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    {
      provide: OBJECT_STORAGE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const endpoint = config.get<string>("OBJECT_STORAGE_ENDPOINT");
        const accessKeyId = config.get<string>("OBJECT_STORAGE_ACCESS_KEY_ID");
        const secretAccessKey = config.get<string>("OBJECT_STORAGE_SECRET_ACCESS_KEY");
        return new S3Client({
          region: config.getOrThrow<string>("OBJECT_STORAGE_REGION"),
          endpoint,
          forcePathStyle: Boolean(endpoint),
          credentials: accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined,
        });
      },
    },
    MediaService,
  ],
  exports: [MediaService],
})
export class MediaModule {}
