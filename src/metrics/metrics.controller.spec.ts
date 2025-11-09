import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { InternalServerErrorException } from '@nestjs/common';
import { register } from 'prom-client';

jest.mock('prom-client');

describe('MetricsController', () => {
	let controller: MetricsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MetricsController],
		}).compile();

		controller = module.get<MetricsController>(MetricsController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getMetrics', () => {
		it('should return prometheus metrics', async () => {
			const mockMetrics = '# TYPE http_requests_total counter\nhttp_requests_total 42';
			(register.metrics as jest.Mock) = jest.fn().mockResolvedValue(mockMetrics);

			const result = await controller.getMetrics();

			expect(result).toBe(mockMetrics);
			expect(register.metrics).toHaveBeenCalled();
		});

		it('should throw InternalServerErrorException on error', async () => {
			(register.metrics as jest.Mock) = jest.fn().mockRejectedValue(new Error('Metrics error'));

			await expect(controller.getMetrics()).rejects.toThrow(InternalServerErrorException);
		});
	});
});
