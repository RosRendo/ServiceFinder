"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AddressesService = class AddressesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createAddressDto) {
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
    async findAllByUser(userId) {
        const addresses = await this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        return addresses.map(this.serializeAddress);
    }
    async findOne(id, userId) {
        const address = await this.prisma.userAddress.findFirst({
            where: { id, userId },
        });
        if (!address) {
            throw new common_1.NotFoundException(`Address with ID ${id} not found`);
        }
        return this.serializeAddress(address);
    }
    async update(id, userId, updateAddressDto) {
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
    async remove(id, userId) {
        await this.findOne(id, userId);
        await this.prisma.userAddress.delete({
            where: { id },
        });
        return { message: 'Address deleted successfully' };
    }
    serializeAddress(address) {
        return {
            ...address,
            id: address.id.toString(),
            userId: address.userId.toString(),
            latitude: address.latitude ? Number(address.latitude) : null,
            longitude: address.longitude ? Number(address.longitude) : null,
        };
    }
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map