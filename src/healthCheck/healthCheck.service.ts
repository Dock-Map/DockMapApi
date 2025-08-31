import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
  async healthCheckDb(): Promise<string> {
    // Временно отключено для тестирования
    return 'DB check disabled for testing';
  }
}
