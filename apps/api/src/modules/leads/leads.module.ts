import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { LeadMatchingProcessor } from "./lead-matching.processor";
import { LeadsController } from "./leads.controller";
import { LEAD_MATCHING_QUEUE, LeadsService } from "./leads.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: LEAD_MATCHING_QUEUE })],
  controllers: [LeadsController],
  providers: [LeadsService, LeadMatchingProcessor],
  exports: [LeadsService],
})
export class LeadsModule {}
