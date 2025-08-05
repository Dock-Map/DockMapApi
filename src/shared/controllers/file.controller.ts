import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { S3Service, UploadResult, FileInfo } from '../services/s3.service';

interface UploadFileResponse {
  success: boolean;
  data?: UploadResult;
  error?: string;
}

interface FileInfoResponse {
  success: boolean;
  data?: FileInfo;
  error?: string;
}

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Папка для сохранения (опционально)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Загрузить файл в Yandex Cloud Object Storage' })
  @ApiResponse({ status: 201, description: 'Файл успешно загружен' })
  @ApiResponse({ status: 400, description: 'Ошибка загрузки файла' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadFileResponse> {
    try {
      if (!file) {
        throw new HttpException('Файл не предоставлен', HttpStatus.BAD_REQUEST);
      }

      const result = await this.s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        folder,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Папка для сохранения изображений',
          default: 'images',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Загрузить изображение в Yandex Cloud Object Storage',
  })
  @ApiResponse({ status: 201, description: 'Изображение успешно загружено' })
  @ApiResponse({ status: 400, description: 'Ошибка загрузки изображения' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string = 'images',
  ): Promise<UploadFileResponse> {
    try {
      if (!file) {
        throw new HttpException(
          'Изображение не предоставлено',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.s3Service.uploadImage(
        file.buffer,
        file.originalname,
        folder,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Получить список файлов в папке' })
  @ApiResponse({ status: 200, description: 'Список файлов получен' })
  async getFileList(@Body('folder') folder?: string) {
    try {
      const list = await this.s3Service.getFileList(folder);
      return {
        success: true,
        data: list,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('download/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Скачать файл' })
  @ApiResponse({ status: 200, description: 'Файл скачан' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async downloadFile(@Param('key') key: string) {
    try {
      const buffer = await this.s3Service.downloadFile(key);
      return {
        success: true,
        data: {
          key,
          size: buffer.length,
          buffer: buffer.toString('base64'),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('info/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Получить информацию о файле' })
  @ApiResponse({ status: 200, description: 'Информация о файле получена' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async getFileInfo(@Param('key') key: string): Promise<FileInfoResponse> {
    try {
      const fileInfo = await this.s3Service.getFileInfo(key);

      if (!fileInfo) {
        throw new HttpException('Файл не найден', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: fileInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('url/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Получить публичный URL файла' })
  @ApiResponse({ status: 200, description: 'URL получен' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async getPublicUrl(@Param('key') key: string): Promise<{ url: string }> {
    const url = this.s3Service.getPublicUrl(key);
    return { url };
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Удалить файл' })
  @ApiResponse({ status: 200, description: 'Файл удален' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async deleteFile(@Param('key') key: string): Promise<{ success: boolean }> {
    const success = await this.s3Service.deleteFile(key);
    return { success };
  }

  @Delete('cleanup/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Удалить все файлы из бакета' })
  @ApiResponse({ status: 200, description: 'Все файлы удалены' })
  async cleanUp(): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.s3Service.cleanUp();
      return { success: true, data: result };
    } catch (error) {
      return { success: false };
    }
  }

  @Get('exists/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Проверить существование файла' })
  @ApiResponse({ status: 200, description: 'Результат проверки' })
  async fileExists(@Param('key') key: string): Promise<{ exists: boolean }> {
    const exists = await this.s3Service.fileExists(key);
    return { exists };
  }
}
