import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional } from "class-validator";
import {
  businessCapabilities,
  businessMemberRoles,
  type BusinessCapability,
  type BusinessMemberRole,
} from "../../../common/auth/business-access.service";

export class UpdateBusinessMemberDto {
  @IsOptional()
  @IsIn(businessMemberRoles)
  role?: BusinessMemberRole;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(businessCapabilities.length)
  @IsIn(businessCapabilities, { each: true })
  permissions?: BusinessCapability[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
