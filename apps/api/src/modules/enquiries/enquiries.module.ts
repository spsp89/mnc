import { Module } from "@nestjs/common";
import { LeadsModule } from "../leads/leads.module";
import { AuthModule } from "../auth/auth.module";
import { EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";

@Module({
  imports: [LeadsModule, AuthModule],
  controllers: [EnquiriesController],
  providers: [EnquiriesService],
})
export class EnquiriesModule {}
