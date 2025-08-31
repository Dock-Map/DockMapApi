import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
  healthCheckDb(): Promise<string> {
    // Временно отключено для тестирования
    return Promise.resolve('DB check disabled for testing');
  }
}
