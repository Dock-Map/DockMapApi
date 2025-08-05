import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import EasyYandexS3 from 'easy-yandex-s3';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  location?: string;
  etag?: string;
}

export interface FileInfo {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
}

@Injectable()
export class S3Service {
  private s3: EasyYandexS3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('YANDEX_S3_BUCKET') || '';

    const accessKeyId = this.configService.get<string>(
      'YANDEX_S3_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'YANDEX_S3_SECRET_ACCESS_KEY',
    );

    // Если S3 не настроен, создаем заглушку
    if (!accessKeyId || !secretAccessKey || !this.bucketName) {
      console.warn(
        'Yandex Cloud S3 credentials not configured. S3Service will work in mock mode.',
      );
      return;
    }

    this.s3 = new EasyYandexS3({
      auth: {
        accessKeyId,
        secretAccessKey,
      },
      Bucket: this.bucketName,
      debug: this.configService.get<string>('NODE_ENV') === 'development',
    });
  }

  /**
   * Загружает файл в Yandex Cloud Object Storage
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    contentType: string,
    folder?: string,
  ): Promise<UploadResult> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }

    const folderPath = folder ? `/${folder}/` : '/';

    const upload = await this.s3.Upload(
      {
        buffer: file,
        name: originalName,
      },
      folderPath,
    );

    if (!upload) {
      throw new Error('Failed to upload file');
    }

    // easy-yandex-s3 возвращает массив или объект
    const uploadData = Array.isArray(upload) ? upload[0] : upload;

    return {
      key: uploadData.Key,
      url: uploadData.Location,
      size: file.length,
      contentType,
      location: uploadData.Location,
      etag: uploadData.ETag,
    };
  }

  /**
   * Загружает изображение с автоматическим определением типа
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    folder: string = 'images',
  ): Promise<UploadResult> {
    const contentType = this.getImageContentType(originalName);

    if (!contentType) {
      throw new Error('Unsupported image format');
    }

    return this.uploadFile(file, originalName, contentType, folder);
  }

  /**
   * Получает список файлов в папке
   */
  async getFileList(folder?: string): Promise<any> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }
    const folderPath = folder ? `/${folder}/` : '/';
    return await this.s3.GetList(folderPath);
  }

  /**
   * Скачивает файл и возвращает буфер
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }
    const download = await this.s3.Download(key);

    if (!download || !download.data?.Body) {
      throw new Error('Failed to download file');
    }

    return download.data.Body as Buffer;
  }

  /**
   * Скачивает файл и сохраняет локально
   */
  async downloadFileToPath(key: string, localPath: string): Promise<boolean> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }
    const download = await this.s3.Download(key, localPath);
    return !!download;
  }

  /**
   * Удаляет файл
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }
    const result = await this.s3.Remove(key);
    return result === true;
  }

  /**
   * Удаляет все файлы из бакета
   */
  async cleanUp(): Promise<any> {
    if (!this.s3) {
      throw new Error(
        'S3Service not configured. Please set Yandex Cloud S3 credentials.',
      );
    }
    return await this.s3.CleanUp();
  }

  /**
   * Получает информацию о файле
   */
  async getFileInfo(key: string): Promise<FileInfo | null> {
    try {
      const list = await this.s3.GetList('/');

      if (!list || typeof list === 'boolean') {
        return null;
      }

      const file = list.Contents?.find((item: any) => item.Key === key);

      if (!file) {
        return null;
      }

      return {
        key: file.Key || '',
        size: file.Size || 0,
        contentType: (file as any).ContentType || 'application/octet-stream',
        lastModified: file.LastModified || new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет существование файла
   */
  async fileExists(key: string): Promise<boolean> {
    const fileInfo = await this.getFileInfo(key);
    return fileInfo !== null;
  }

  /**
   * Получает публичный URL файла
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.storage.yandexcloud.net/${key}`;
  }

  /**
   * Определяет MIME тип изображения по расширению
   */
  private getImageContentType(filename: string): string | null {
    const extension = filename.toLowerCase().split('.').pop();

    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
    };

    return mimeTypes[extension || ''] || null;
  }

  /**
   * Получает размер файла
   */
  async getFileSize(key: string): Promise<number> {
    const fileInfo = await this.getFileInfo(key);
    return fileInfo?.size || 0;
  }
}
