import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  /** POST /api/conversations — get or create a conversation with a company */
  @Post()
  startConversation(@Request() req: any, @Body() dto: StartConversationDto) {
    return this.service.getOrCreateConversation(BigInt(req.user?.id || req.user?.userId || 0), dto);
  }

  /** GET /api/conversations/unread — get unread messages count */
  @Get('unread')
  async getUnreadCount(@Request() req: any) {
    return this.service.getUnreadCount(BigInt(req.user?.id || req.user?.userId || 0));
  }

  /** GET /api/conversations — list my conversations */
  @Get()
  async getMyConversations(@Request() req: any) {
    const res = await this.service.getMyConversations(BigInt(req.user?.id || req.user?.userId || 0));
    Logger.log(
      'RETURNING ' +
        JSON.stringify(
          res,
          (k, v) => (typeof v === 'bigint' ? v.toString() : v),
          2,
        ),
      'ConversationsController',
    );
    return res;
  }

  /** GET /api/conversations/:id/messages — load messages */
  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Request() req: any,
    @Query() query: any,
  ) {
    Logger.log(
      `GET /api/conversations/${id}/messages called by user ${req.user?.id || req.user?.userId || 0}`,
      'ConversationsController',
    );
    const res = await this.service.getMessages(
      BigInt(id),
      BigInt(req.user?.id || req.user?.userId || 0),
      query,
    );
    Logger.log(
      `getMessages returned ${res.data.length} messages for conv ${id}`,
      'ConversationsController',
    );
    return res;
  }

  /** POST /api/conversations/:id/messages — send a message */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CreateMessageDto,
  ) {
    return this.service.sendMessage(BigInt(id), BigInt(req.user?.id || req.user?.userId || 0), dto);
  }
}
