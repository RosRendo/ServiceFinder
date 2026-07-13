import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SavedItemsService } from './saved-items.service';
import { SavedItemDto } from './dto/saved-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Saved Items')
@ApiBearerAuth()
@Controller('saved-items')
@UseGuards(JwtAuthGuard)
export class SavedItemsController {
  constructor(private readonly savedItemsService: SavedItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get saved items for the current user' })
  @ApiResponse({ status: 200, description: 'Return saved items.' })
  getSavedItems(@Request() req, @Query() query: any) {
    return this.savedItemsService.getSavedItems(req.user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Save an item (company or service)' })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully saved.',
  })
  saveItem(@Request() req, @Body() savedItemDto: SavedItemDto) {
    return this.savedItemsService.saveItem(req.user.id, savedItemDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove a saved item' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed.',
  })
  unsaveItem(@Request() req, @Body() savedItemDto: SavedItemDto) {
    return this.savedItemsService.unsaveItem(req.user.id, savedItemDto);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if an item is saved' })
  @ApiResponse({
    status: 200,
    description: 'Returns boolean indicating if item is saved.',
  })
  checkSaved(@Request() req, @Query() query: any) {
    return this.savedItemsService.checkSaved(req.user.id, query);
  }
}
