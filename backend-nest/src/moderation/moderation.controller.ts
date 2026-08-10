import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all moderation logs filtered by status' })
  getLogs(@Query('status') status?: string) {
    return this.moderationService.getLogs(status);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Apply a moderation action (resolve/dismiss/ban)' })
  applyAction(@Param('id') id: string, @Body() body: { action: string }) {
    return this.moderationService.applyAction(Number(id), body.action);
  }
}
