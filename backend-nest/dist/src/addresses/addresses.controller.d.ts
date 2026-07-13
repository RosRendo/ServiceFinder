import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    create(createAddressDto: CreateAddressDto, user: any): Promise<any>;
    findAll(user: any): Promise<any[]>;
    findOne(id: string, user: any): Promise<any>;
    update(id: string, updateAddressDto: UpdateAddressDto, user: any): Promise<any>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
