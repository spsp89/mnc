import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, type AuthenticatedRequest } from "../../common/auth/jwt-auth.guard";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";

@ApiTags("conversations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.conversations.list(request.user.id, page, pageSize);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateConversationDto) {
    return this.conversations.create(request.user.id, input);
  }

  @Get(":conversationId/messages")
  messages(
    @Req() request: AuthenticatedRequest,
    @Param("conversationId") conversationId: string,
    @Query("page", new ParseIntPipe({ optional: true })) page?: number,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.conversations.messages(request.user.id, conversationId, page, pageSize);
  }

  @Post(":conversationId/messages")
  send(
    @Req() request: AuthenticatedRequest,
    @Param("conversationId") conversationId: string,
    @Body() input: SendMessageDto,
  ) {
    return this.conversations.send(request.user.id, conversationId, input);
  }

  @Patch(":conversationId/read")
  read(@Req() request: AuthenticatedRequest, @Param("conversationId") conversationId: string) {
    return this.conversations.markRead(request.user.id, conversationId);
  }

  @Patch(":conversationId/archive")
  archive(@Req() request: AuthenticatedRequest, @Param("conversationId") conversationId: string) {
    return this.conversations.archive(request.user.id, conversationId);
  }
}
