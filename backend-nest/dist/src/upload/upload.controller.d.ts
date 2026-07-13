import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadFile(file: Express.Multer.File): Promise<{
        success: boolean;
        url: any;
        public_id: any;
        format: any;
    }>;
}
