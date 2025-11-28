import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly publicS3Client: S3Client; // Отдельный клиент для генерации подписанных URL
  readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly publicEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'images';
    this.region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    // Публичный endpoint для внешнего доступа (по умолчанию = endpoint)
    this.publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT') || this.endpoint;

    const credentials = {
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID') || '',
      secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '',
    };

    // Основной клиент для операций с файлами (использует внутренний endpoint)
    const s3Config: any = {
      region: this.region,
      credentials,
    };

    // Если указан endpoint (для MinIO), добавляем его
    if (this.endpoint) {
      s3Config.endpoint = this.endpoint;
      s3Config.forcePathStyle = true; // Необходимо для MinIO
    }

    this.s3Client = new S3Client(s3Config);

    // Отдельный клиент для генерации подписанных URL с публичным endpoint
    // Это важно, так как подпись S3 включает хост в расчет
    const publicS3Config: any = {
      region: this.region,
      credentials,
    };

    if (this.publicEndpoint) {
      publicS3Config.endpoint = this.publicEndpoint;
      publicS3Config.forcePathStyle = true;
    }

    this.publicS3Client = new S3Client(publicS3Config);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ key: string; url: string }> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${randomUUID()}.${fileExtension}`;
      const key = folder ? `${folder}/${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Генерируем signed URL для доступа к файлу используя публичный клиент
      // Это важно, так как подпись S3 включает хост в расчет
      const getCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const url = await getSignedUrl(this.publicS3Client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7 дней

      this.logger.log(`File uploaded successfully: ${key}`);

      return { key, url };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      // Используем публичный клиент для генерации подписанного URL
      // Это важно, так как подпись S3 включает хост в расчет
      const url = await getSignedUrl(this.publicS3Client, command, { expiresIn });
      
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

