// @ts-nocheck
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Companies')
@Controller('companies')
@UseInterceptors(CacheInterceptor)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
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
  @ApiResponse({ status: 201, description: 'The company has been successfully created.' })
  createCompany(@Body() createCompanyDto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.companiesService.createCompany(user.id, createCompanyDto);
  }

  @Get(':id')
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
  @ApiResponse({ status: 200, description: 'The company has been successfully updated.' })
  updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @CurrentUser() user: any) {
    return this.companiesService.updateCompany(BigInt(id), user.id, user.role, updateCompanyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a company' })
  @ApiResponse({ status: 200, description: 'The company has been successfully deleted.' })
  deleteCompany(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companiesService.deleteCompany(BigInt(id), user.id, user.role);
  }
}

