import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
export declare class UploadService {
    uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse>;
}
