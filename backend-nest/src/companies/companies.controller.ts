import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  AddAvailabilityDto,
  GenerateAvailabilityDto,
} from './dto/availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  getAllCompanies(@Query() query: any) {
    return this.companiesService.getAllCompanies(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'The company has been successfully created.',
  })
  createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.createCompany(user.id, createCompanyDto);
  }

  @Get('my-company')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the logged in user's company" })
  @ApiResponse({ status: 200, description: 'Return company details.' })
  getMyCompany(@CurrentUser() user: any) {
    return this.companiesService.getMyCompany(BigInt(user.id));
  }

  @Put('my-company')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user company details' })
  async updateMyCompany(@CurrentUser() user: any, @Body() body: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.updateCompany(company.id, BigInt(user.id), user.role, body);
  }

  @Get('my-company/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get KPI metrics for the user's company" })
  @ApiResponse({ status: 200, description: 'Return company metrics.' })
  getMyCompanyMetrics(@CurrentUser() user: any) {
    return this.companiesService.getMyCompanyMetrics(BigInt(user.id));
  }

  @Get('my-company/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get staff for the user's company" })
  @ApiResponse({ status: 200, description: 'Return company staff list.' })
  getMyCompanyStaff(@CurrentUser() user: any) {
    return this.companiesService.getMyCompanyStaff(BigInt(user.id));
  }

  @Get('my-company/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get customers for the user's company" })
  @ApiResponse({ status: 200, description: 'Return company customers list.' })
  async getMyCompanyCustomers(@CurrentUser() user: any, @Query() query: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.getCompanyCustomers(company.id, query);
  }

  @Get('my-company/customers/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get customer detail for the user's company" })
  @ApiResponse({ status: 200, description: 'Return company customer detail.' })
  async getMyCompanyCustomer(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
  ) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.getCompanyCustomerDetail(company.id, BigInt(customerId));
  }

  @Get('my-company/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company reviews' })
  @ApiResponse({ status: 200, description: 'Return list of reviews for the current company.' })
  async getMyCompanyReviews(@CurrentUser() user: any, @Query() query: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.companiesService.getCompanyReviews(company.id, query);
  }

  @Get('my-company/reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company review detail' })
  @ApiResponse({ status: 200, description: 'Return review detail for the current company.' })
  async getMyCompanyReview(
    @CurrentUser() user: any,
    @Param('reviewId') reviewId: string,
  ) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.getCompanyReviewDetail(company.id, BigInt(reviewId));
  }

  @Get('my-company/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company revenue data' })
  @ApiResponse({ status: 200, description: 'Return revenue data for the current company.' })
  async getMyCompanyRevenue(@CurrentUser() user: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.companiesService.getCompanyRevenue(company.id);
  }

  @Get('my-company/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company services' })
  @ApiResponse({ status: 200, description: 'Return services for the current company.' })
  async getMyCompanyServices(@CurrentUser() user: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.companiesService.getCompanyServices(company.id);
  }

  @Get('my-company/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current company service detail' })
  @ApiResponse({ status: 200, description: 'Return service detail for the current company.' })
  async getMyCompanyService(
    @CurrentUser() user: any,
    @Param('serviceId') serviceId: string,
  ) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.getCompanyServiceDetail(company.id, BigInt(serviceId));
  }

  @Post('my-company/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  async createMyCompanyService(@CurrentUser() user: any, @Body() body: any) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.createCompanyService(company.id, body);
  }

  @Put('my-company/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing service' })
  async updateMyCompanyService(
    @CurrentUser() user: any,
    @Param('serviceId') serviceId: string,
    @Body() body: any
  ) {
    const company = await this.companiesService.getMyCompany(BigInt(user.id));
    return this.companiesService.updateCompanyService(company.id, BigInt(serviceId), body);
  }

  @Get('staff/:staffId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific staff member' })
  @ApiResponse({ status: 200, description: 'Return staff member details.' })
  getStaffMemberById(
    @Param('staffId') staffId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.getStaffMemberById(
      BigInt(staffId),
      BigInt(user.id),
    );
  }

  @Post('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new staff member' })
  @ApiResponse({ status: 201, description: 'Staff member added.' })
  addStaffMember(@Body() body: any, @CurrentUser() user: any) {
    return this.companiesService.addStaffMember(BigInt(user.id), body);
  }

  @Put('staff/:staffId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a specific staff member' })
  @ApiResponse({ status: 200, description: 'Staff member updated.' })
  updateStaffMember(
    @Param('staffId') staffId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.updateStaffMember(
      BigInt(staffId),
      BigInt(user.id),
      body,
    );
  }

  @Delete('staff/:staffId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a specific staff member' })
  @ApiResponse({ status: 200, description: 'Staff member removed.' })
  removeStaffMember(
    @Param('staffId') staffId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.removeStaffMember(
      BigInt(staffId),
      BigInt(user.id),
    );
  }

  @Post('staff/:staffId/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a specific staff member' })
  @ApiResponse({ status: 200, description: 'Staff member reactivated.' })
  reactivateStaffMember(
    @Param('staffId') staffId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.reactivateStaffMember(
      BigInt(staffId),
      BigInt(user.id),
    );
  }

  @Get('staff/:staffId/wallet')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get staff wallet details and transactions' })
  @ApiResponse({ status: 200, description: 'Return staff wallet details.' })
  getStaffWallet(@Param('staffId') staffId: string, @CurrentUser() user: any) {
    return this.companiesService.getStaffWallet(
      BigInt(staffId),
      BigInt(user.id),
      user.role,
    );
  }

  @Post('staff/:staffId/wallet/topup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Top up a staff member's digital wallet" })
  @ApiResponse({ status: 200, description: 'Wallet topped up successfully.' })
  topUpStaffWallet(
    @Param('staffId') staffId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.topUpStaffWallet(
      BigInt(staffId),
      BigInt(user.id),
      body,
    );
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the user company subscription details' })
  @ApiResponse({ status: 200, description: 'Return company subscription.' })
  getCompanySubscription(@CurrentUser() user: any) {
    return this.companiesService.getCompanySubscription(BigInt(user.id));
  }

  @Post('subscription/upgrade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade the user company subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded.' })
  upgradeSubscription(
    @Body() body: { planId: string },
    @CurrentUser() user: any,
  ) {
    return this.companiesService.upgradeSubscription(
      BigInt(user.id),
      body.planId,
    );
  }

  @Get('my-company/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get marketing campaigns for the user's company" })
  @ApiResponse({
    status: 200,
    description: 'Return company marketing campaigns.',
  })
  getMyCompanyCampaigns(@CurrentUser() user: any) {
    return this.companiesService.getMyCompanyCampaigns(BigInt(user.id));
  }

  @Get('featured')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get featured companies' })
  @ApiResponse({ status: 200, description: 'Return featured companies.' })
  getFeaturedCompanies(@Query() query: any) {
    return this.companiesService.getFeaturedCompanies(query);
  }

  @Get('nearby')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get nearby companies' })
  @ApiResponse({ status: 200, description: 'Return nearby companies.' })
  getNearbyCompanies(@Query() query: any) {
    return this.companiesService.getNearbyCompanies(query);
  }

  @Get('new')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get new companies' })
  @ApiResponse({ status: 200, description: 'Return new companies.' })
  getNewCompanies(@Query() query: any) {
    return this.companiesService.getNewCompanies(query);
  }

  @Get('recommended')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get recommended companies' })
  @ApiResponse({ status: 200, description: 'Return recommended companies.' })
  getRecommendedCompanies(@Query() query: any) {
    return this.companiesService.getRecommendedCompanies(query);
  }


  @Get('categories/:categorySlug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get companies by category' })
  @ApiResponse({ status: 200, description: 'Return companies by category.' })
  getCompaniesByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query() query: any,
  ) {
    return this.companiesService.getCompaniesByCategory(categorySlug, query);
  }

  @Get('categories/:categorySlug/service-types/:serviceTypeSlug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get companies by category and service type' })
  @ApiResponse({ status: 200, description: 'Return companies.' })
  getCompaniesByServiceType(
    @Param('categorySlug') categorySlug: string,
    @Param('serviceTypeSlug') serviceTypeSlug: string,
    @Query() query: any,
  ) {
    return this.companiesService.getCompaniesByServiceType(
      categorySlug,
      serviceTypeSlug,
      query,
    );
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Return company details.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company details' })
  @ApiResponse({
    status: 200,
    description: 'The company has been successfully updated.',
  })
  updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.updateCompany(
      BigInt(id),
      user.id,
      user.role,
      updateCompanyDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a company' })
  @ApiResponse({
    status: 200,
    description: 'The company has been successfully deleted.',
  })
  deleteCompany(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companiesService.deleteCompany(BigInt(id), user.id, user.role);
  }

  @Post('my-company/staff/:staffId/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an availability slot for a staff member' })
  addStaffAvailability(
    @Param('staffId') staffId: string,
    @Body() dto: AddAvailabilityDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.addStaffAvailability(
      BigInt(user.id),
      BigInt(staffId),
      dto,
    );
  }

  @Post('my-company/staff/:staffId/availability/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate availability slots for a date range' })
  generateStaffAvailability(
    @Param('staffId') staffId: string,
    @Body() dto: GenerateAvailabilityDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.generateStaffAvailability(
      BigInt(user.id),
      BigInt(staffId),
      dto,
    );
  }

  @Get('my-company/staff/:staffId/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'company_staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get availability slots for a staff member' })
  getStaffAvailability(
    @Param('staffId') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.getStaffAvailability(
      BigInt(user.id),
      BigInt(staffId),
      startDate,
      endDate,
    );
  }

  @Delete('my-company/availability/:slotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an availability slot' })
  removeStaffAvailability(
    @Param('slotId') slotId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.removeStaffAvailability(
      BigInt(user.id),
      BigInt(slotId),
    );
  }

  @Post('staff/:staffId/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add compliance document for staff' })
  addStaffDocument(
    @Param('staffId') staffId: string,
    @Body() dto: { name: string; documentUrl: string; expiryDate?: string },
    @CurrentUser() user: any,
  ) {
    return this.companiesService.addStaffDocument(
      BigInt(staffId),
      BigInt(user.id),
      dto,
    );
  }

  @Post('staff/:staffId/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add private note for staff' })
  addStaffNote(
    @Param('staffId') staffId: string,
    @Body() dto: { note: string },
    @CurrentUser() user: any,
  ) {
    return this.companiesService.addStaffNote(
      BigInt(staffId),
      BigInt(user.id),
      dto,
    );
  }

  @Delete('staff/notes/:noteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a private staff note' })
  deleteStaffNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.deleteStaffNote(
      BigInt(noteId),
      BigInt(user.id),
    );
  }
}
