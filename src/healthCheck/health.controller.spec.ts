import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from './healthCheck.controller';
import { HealthCheckService } from './healthCheck.service';
import { Connection } from 'typeorm';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;

  beforeEach(async () => {
    const mockConnection = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        HealthCheckService,
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    healthCheckController = app.get<HealthCheckController>(
      HealthCheckController,
    );
  });

  describe('check health server', () => {
    it('should return "sucsess" on general controller', () => {
      expect(healthCheckController.healthCheck()).toBe('sucsess');
    });
  });

  describe('check health db', () => {
    it('should return "Connected to DB!" on db controller', async () => {
      expect(await healthCheckController.healthCheckDb()).toBe(
        'Connected to DB!',
      );
    });
  });
});
