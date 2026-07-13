import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestContactUpdateDto } from './dto/request-contact-update.dto';
import { VerifyContactUpdateDto } from './dto/verify-contact-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Get('staff/recommended')
  @ApiOperation({ summary: 'Get recommended staff' })
  @ApiResponse({ status: 200, description: 'Return recommended staff.' })
  getRecommendedStaff(@Query() query: any) {
    return this.usersService.getRecommendedStaff(query);
  }

  @Get('admin/metrics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get global metrics for Admin Dashboard' })
  @ApiResponse({ status: 200, description: 'Return global metrics.' })
  getAdminMetrics() {
    return this.usersService.getAdminMetrics();
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'Return user preferences.' })
  async getMyPreferences(@CurrentUser() user: any) {
    try {
      return await this.usersService.getPreferences(BigInt(user.id));
    } catch (e: any) {
      require('fs').appendFileSync('error_log.txt', e.stack + '\n');
      throw e;
    }
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully.',
  })
  updateMyPreferences(
    @Body()
    dto: {
      emailNotificationsEnabled?: boolean;
      pushNotificationsEnabled?: boolean;
      pushToken?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.usersService.updatePreferences(BigInt(user.id), dto);
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
  updateUserPut(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUser(BigInt(id), updateUserDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Patch)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  updateUserPatch(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUser(BigInt(id), updateUserDto, user);
  }

  @Post('request-contact-update')
  @ApiOperation({ summary: 'Request OTP/Code to update email or phone' })
  @ApiResponse({ status: 200, description: 'OTP/Code sent successfully.' })
  requestContactUpdate(
    @Body() requestContactUpdateDto: RequestContactUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.requestContactUpdate(
      BigInt(user.id),
      requestContactUpdateDto,
    );
  }

  @Post('verify-contact-update')
  @ApiOperation({ summary: 'Verify OTP/Code to update email or phone' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully.' })
  verifyContactUpdate(
    @Body() verifyContactUpdateDto: VerifyContactUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.verifyContactUpdate(
      BigInt(user.id),
      verifyContactUpdateDto,
    );
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete own account (Anonymize data)' })
  @ApiResponse({ status: 200, description: 'Account anonymized successfully.' })
  deleteOwnAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(BigInt(user.id));
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
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
  })
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUserStatus(
      BigInt(id),
      updateStatusDto,
      user,
    );
  }

  @Patch('me/staff-status')
  @Roles('staff')
  @ApiOperation({ summary: 'Update staff online status' })
  @ApiResponse({
    status: 200,
    description: 'Staff status updated successfully.',
  })
  updateStaffStatus(
    @Body('status') status: 'active' | 'inactive',
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateStaffStatus(BigInt(user.id), status);
  }
}
