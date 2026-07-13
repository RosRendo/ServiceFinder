import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: bigint, createAddressDto: CreateAddressDto): Promise<any>;
    findAllByUser(userId: bigint): Promise<any[]>;
    findOne(id: bigint, userId: bigint): Promise<any>;
    update(id: bigint, userId: bigint, updateAddressDto: UpdateAddressDto): Promise<any>;
    remove(id: bigint, userId: bigint): Promise<{
        message: string;
    }>;
    private serializeAddress;
}
