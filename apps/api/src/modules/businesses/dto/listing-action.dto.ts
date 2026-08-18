import { IsIn } from "class-validator";

export class ListingActionDto {
  @IsIn(["PUBLISH", "UNPUBLISH", "ARCHIVE"])
  action!: "PUBLISH" | "UNPUBLISH" | "ARCHIVE";
}
