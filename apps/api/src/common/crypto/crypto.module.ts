import { Global, Module } from "@nestjs/common";
import { PersonalDataService } from "./personal-data.service";

@Global()
@Module({
  providers: [PersonalDataService],
  exports: [PersonalDataService],
})
export class CryptoModule {}

