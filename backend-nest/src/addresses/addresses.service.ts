import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, createAddressDto: CreateAddressDto) {
    if (createAddressDto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await this.prisma.userAddress.create({
      data: {
        userId,
        label: createAddressDto.label,
        address: createAddressDto.address,
        latitude: createAddressDto.latitude,
        longitude: createAddressDto.longitude,
        isDefault: createAddressDto.isDefault || false,
      },
    });

    return this.serializeAddress(newAddress);
  }

  async findAllByUser(userId: bigint) {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map(this.serializeAddress);
  }

  async findOne(id: bigint, userId: bigint) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return this.serializeAddress(address);
  }

  async update(id: bigint, userId: bigint, updateAddressDto: UpdateAddressDto) {
    const address = await this.findOne(id, userId);

    if (updateAddressDto.isDefault && !address.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.userAddress.update({
      where: { id },
      data: updateAddressDto,
    });

    return this.serializeAddress(updated);
  }

  async remove(id: bigint, userId: bigint) {
    await this.findOne(id, userId); // check exists & belongs to user
    await this.prisma.userAddress.delete({
      where: { id },
    });
    return { message: 'Address deleted successfully' };
  }

  private serializeAddress(address: any) {
    return {
      ...address,
      id: address.id.toString(),
      userId: address.userId.toString(),
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
    };
  }
}
