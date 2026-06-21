import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ChatbotService } from './chatbot.service';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  /** Create a new conversation session */
  @Post('sessions')
  createSession(@Req() req: any) {
    return this.chatbotService.createSession(req.user.id);
  }

  /** List all sessions for the authenticated user */
  @Get('sessions')
  getSessions(@Req() req: any) {
    return this.chatbotService.getSessions(req.user.id);
  }

  /** Get the full message history of a session */
  @Get('sessions/:sessionId/history')
  getHistory(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.chatbotService.getHistory(sessionId, req.user.id);
  }

  /** Delete a session and all its messages */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  deleteSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.chatbotService.deleteSession(sessionId, req.user.id);
  }

  /** Send a message and receive the AI response */
  @Post('sessions/:sessionId/chat')
  @HttpCode(HttpStatus.OK)
  chat(
    @Param('sessionId') sessionId: string,
    @Body() body: SendMessageDto,
    @Req() req: any,
  ) {
    return this.chatbotService.chat(sessionId, body.message, req.user.id);
  }
}
