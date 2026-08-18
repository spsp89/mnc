import { IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class CreateCheckoutDto {
  @ValidateIf((value: CreateCheckoutDto) => !value.subscriptionId)
  @IsString()
  orderId?: string;

  @ValidateIf((value: CreateCheckoutDto) => !value.orderId)
  @IsString()
  subscriptionId?: string;

  @IsString()
  @MinLength(12)
  @MaxLength(100)
  idempotencyKey!: string;
}
