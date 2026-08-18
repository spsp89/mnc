import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional } from "class-validator";
import {
  businessCapabilities,
  businessMemberRoles,
  type BusinessCapability,
  type BusinessMemberRole,
} from "../../../common/auth/business-access.service";

export class AddBusinessMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(businessMemberRoles)
  role!: BusinessMemberRole;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(businessCapabilities.length)
  @IsIn(businessCapabilities, { each: true })
  permissions?: BusinessCapability[];
}
