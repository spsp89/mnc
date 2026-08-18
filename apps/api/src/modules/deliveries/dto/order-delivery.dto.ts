import { IsString } from "class-validator";

export class OrderDeliveryDto {
  @IsString() orderId!: string;
}
