// @ts-nocheck
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  getAllUsers(@Query() query: any) {
    return this.usersService.getAllUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return user details.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(BigInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user (Put)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  updateUserPut(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.updateUser(BigInt(id), updateUserDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Patch)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  updateUserPatch(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.updateUser(BigInt(id), updateUserDto, user);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.deleteUser(BigInt(id), user);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully.' })
  updateUserStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.usersService.updateUserStatus(BigInt(id), updateStatusDto, user);
  }
}

