import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Services')
@Controller('services')
@UseInterceptors(CacheInterceptor)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @CacheTTL(30000) // 30 seconds (dynamic content)
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'Return all services.' })
  getAllServices(@Query() query: any) {
    return this.servicesService.getAllServices(query);
  }

  @Get('trending')
  @CacheTTL(60000) // 60 seconds
  @ApiOperation({ summary: 'Get trending services' })
  @ApiResponse({ status: 200, description: 'Return trending services.' })
  getTrendingServices(@Query() query: any) {
    return this.servicesService.getTrendingServices(query);
  }

  @Get('deals')
  @CacheTTL(60000)
  @ApiOperation({ summary: 'Get services with bundle deals/discounts' })
  @ApiResponse({ status: 200, description: 'Return discounted services.' })
  getDeals(@Query() query: any) {
    return this.servicesService.getDeals(query);
  }

  @Get('company/:companyId')
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get services by company ID' })
  @ApiResponse({
    status: 200,
    description: 'Return services for the given company.',
  })
  getServicesByCompany(
    @Param('companyId') companyId: string,
    @Query() query: any,
  ) {
    return this.servicesService.getServicesByCompany(companyId, query);
  }

  @Get(':id')
  @CacheTTL(30000)
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Return service details.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  getServiceById(@Param('id') id: string) {
    return this.servicesService.getServiceById(BigInt(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'The service has been successfully created.',
  })
  createService(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    return this.servicesService.createService(createServiceDto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({
    status: 200,
    description: 'The service has been successfully updated.',
  })
  updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req,
  ) {
    return this.servicesService.updateService(
      BigInt(id),
      updateServiceDto,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({
    status: 200,
    description: 'The service has been successfully deleted.',
  })
  deleteService(@Param('id') id: string, @Request() req) {
    return this.servicesService.deleteService(BigInt(id), req.user);
  }
}
