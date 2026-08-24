import {
  Controller,
  Post,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const result = await this.uploadService.uploadImage(file);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
      };
    } catch (error) {
      throw new BadRequestException('Image upload failed: ' + error.message);
    }
  }
}
