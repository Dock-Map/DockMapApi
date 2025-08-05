import { Module } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { FileController } from './controllers/file.controller';

@Module({
  controllers: [FileController],
  providers: [S3Service],
  exports: [S3Service],
})
export class SharedModule {}
