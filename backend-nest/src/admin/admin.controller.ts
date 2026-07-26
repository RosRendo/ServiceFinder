import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get overall platform analytics' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(BigInt(id));
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user details' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.adminService.updateUser(BigInt(id), dto);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  suspendUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.setUserStatus(
      BigInt(id),
      'suspended',
      body.reason,
    );
  }

  @Post('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user' })
  unsuspendUser(@Param('id') id: string) {
    return this.adminService.setUserStatus(BigInt(id), 'active');
  }

  // ─── Companies ───────────────────────────────────────────────────────────────

  @Get('companies')
  @ApiOperation({ summary: 'List all companies with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getCompanies(@Query() query: any) {
    return this.adminService.getCompanies(query);
  }

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update company details' })
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyAdminDto) {
    return this.adminService.updateCompany(BigInt(id), dto);
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get details of a specific company' })
  getCompanyDetails(@Param('id') id: string) {
    return this.adminService.getCompanyDetails(id);
  }

  @Post('companies')
  @ApiOperation({ summary: 'Create a new company and company admin user' })
  createCompanyAdmin(@Body() dto: CreateCompanyAdminDto) {
    return this.adminService.createCompanyAdmin(dto);
  }

  @Post('companies/:id/verify')
  @ApiOperation({ summary: 'Verify a company' })
  verifyCompany(@Param('id') id: string) {
    return this.adminService.setCompanyVerification(BigInt(id), 'verified');
  }

  @Post('companies/:id/accept')
  @ApiOperation({ summary: 'Accept a company verification' })
  acceptCompany(@Param('id') id: string) {
    return this.adminService.setCompanyVerification(BigInt(id), 'verified');
  }

  @Post('companies/:id/reject')
  @ApiOperation({ summary: 'Reject a company verification' })
  rejectCompany(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.setCompanyVerification(
      BigInt(id),
      'rejected',
      body.reason,
    );
  }

  @Post('companies/:id/expire-trial')
  @ApiOperation({ summary: 'Expire a company trial immediately' })
  expireCompanyTrial(@Param('id') id: string) {
    return this.adminService.expireCompanyTrial(BigInt(id));
  }

  // ─── Disputes ────────────────────────────────────────────────────────────────

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  @ApiQuery({ name: 'status', required: false })
  getAllDisputes(@Query() query: any) {
    return this.adminService.getAllDisputes(query);
  }

  @Patch('disputes/:id')
  @ApiOperation({ summary: 'Resolve a dispute' })
  resolveDispute(
    @Param('id') id: string,
    @Body()
    dto: { status: string; adminDecision: string; refundAmount?: number },
  ) {
    return this.adminService.resolveDispute(+id, dto);
  }

  // ─── Payments / Refunds ──────────────────────────────────────────────────────

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Process a manual refund for a payment' })
  refundPayment(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.adminService.processRefund(BigInt(id), body);
  }

  // ─── Transactions ────────────────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'List all financial transactions' })
  @ApiQuery({ name: 'type', required: false, description: 'credit or debit' })
  getTransactions(@Query() query: any) {
    return this.adminService.getTransactions(query);
  }

  // ─── Payouts ─────────────────────────────────────────────────────────────────

  @Get('payouts')
  @ApiOperation({ summary: 'List all payout requests' })
  @ApiQuery({ name: 'status', required: false })
  getPayouts(@Query() query: any) {
    return this.adminService.getPayouts(query);
  }

  @Post('payouts/:id/approve')
  @ApiOperation({ summary: 'Approve a payout request' })
  approvePayout(@Param('id') id: string) {
    return this.adminService.updatePayoutStatus(+id, 'completed');
  }

  @Post('payouts/:id/reject')
  @ApiOperation({ summary: 'Reject a payout request' })
  rejectPayout(@Param('id') id: string) {
    return this.adminService.updatePayoutStatus(+id, 'failed');
  }

  // ─── Invoices ────────────────────────────────────────────────────────────────

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices' })
  getInvoices(@Query() query: any) {
    return this.adminService.getInvoices(query);
  }
}
