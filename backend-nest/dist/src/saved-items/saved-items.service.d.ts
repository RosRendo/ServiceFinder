import { PrismaService } from '../prisma/prisma.service';
import { SavedItemDto } from './dto/saved-item.dto';
export declare class SavedItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSavedItems(userId: bigint, query: any): Promise<{
        success: boolean;
        items: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    saveItem(userId: bigint, dto: SavedItemDto): Promise<{
        savedItem: {
            id: string;
        };
        message: string;
    }>;
    unsaveItem(userId: bigint, dto: SavedItemDto): Promise<{
        message: string;
    }>;
    checkSaved(userId: bigint, query: any): Promise<{
        itemType: any;
        savedIds: any;
    }>;
}
