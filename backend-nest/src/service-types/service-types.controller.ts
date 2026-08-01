import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Service Types')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all service types' })
  @ApiResponse({ status: 200, description: 'Return all service types.' })
  getAllServiceTypes() {
    return this.serviceTypesService.getAllServiceTypes();
  }

  @Get('category/:categorySlug')
  @ApiOperation({ summary: 'Get service types by category slug' })
  @ApiResponse({ status: 200, description: 'Return service types.' })
  getServiceTypesByCategory(@Param('categorySlug') categorySlug: string) {
    return this.serviceTypesService.getServiceTypesByCategory(categorySlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get service type by slug' })
  @ApiResponse({ status: 200, description: 'Return service type details.' })
  @ApiResponse({ status: 404, description: 'Service type not found.' })
  getServiceTypeBySlug(@Param('slug') slug: string) {
    return this.serviceTypesService.getServiceTypeBySlug(slug);
  }

  @Get(':slug/providers')
  @ApiOperation({ summary: 'Get providers (companies) offering a specific service type' })
  @ApiResponse({ status: 200, description: 'Return list of providers with pure facts.' })
  getProvidersForServiceType(@Param('slug') slug: string) {
    return this.serviceTypesService.getProvidersForServiceType(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service type (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The service type has been successfully created.',
  })
  createServiceType(@Body() createServiceTypeDto: CreateServiceTypeDto) {
    return this.serviceTypesService.createServiceType(createServiceTypeDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service type (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The service type has been successfully updated.',
  })
  updateServiceType(
    @Param('id') id: string,
    @Body() updateServiceTypeDto: UpdateServiceTypeDto,
  ) {
    return this.serviceTypesService.updateServiceType(
      BigInt(id),
      updateServiceTypeDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service type (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The service type has been successfully deleted.',
  })
  deleteServiceType(@Param('id') id: string) {
    return this.serviceTypesService.deleteServiceType(BigInt(id));
  }
}
