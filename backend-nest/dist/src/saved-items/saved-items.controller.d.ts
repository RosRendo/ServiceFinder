import { SavedItemsService } from './saved-items.service';
import { SavedItemDto } from './dto/saved-item.dto';
export declare class SavedItemsController {
    private readonly savedItemsService;
    constructor(savedItemsService: SavedItemsService);
    getSavedItems(req: any, query: any): Promise<{
        items: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    saveItem(req: any, savedItemDto: SavedItemDto): Promise<{
        savedItem: {
            id: string;
        };
        message: string;
    }>;
    unsaveItem(req: any, savedItemDto: SavedItemDto): Promise<{
        message: string;
    }>;
    checkSaved(req: any, query: any): Promise<{
        itemType: any;
        savedIds: any;
    }>;
}
