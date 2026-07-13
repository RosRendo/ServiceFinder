import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new saved address' })
  create(@Body() createAddressDto: CreateAddressDto, @CurrentUser() user: any) {
    return this.addressesService.create(BigInt(user.id), createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved addresses for current user' })
  findAll(@CurrentUser() user: any) {
    return this.addressesService.findAllByUser(BigInt(user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific address' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.findOne(BigInt(id), BigInt(user.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @CurrentUser() user: any,
  ) {
    return this.addressesService.update(
      BigInt(id),
      BigInt(user.id),
      updateAddressDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.remove(BigInt(id), BigInt(user.id));
  }
}
