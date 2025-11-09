import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService, HealthStatus, ServiceStatus } from './app.service';

describe('AppController', () => {
	let appController: AppController;
	let appService: AppService;

	const mockAppService = {
		getHealthCheck: jest.fn(),
	};

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [
				{
					provide: AppService,
					useValue: mockAppService,
				},
			],
		}).compile();

		appController = app.get<AppController>(AppController);
		appService = app.get<AppService>(AppService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(appController).toBeDefined();
	});

	describe('getHealth', () => {
		it('should return health check status', async () => {
			const mockHealthCheck = {
				status: HealthStatus.HEALTHY,
				timestamp: new Date().toISOString(),
				service: 'nestjs-server',
				uptime: 3600,
				checks: {
					database: {
						status: ServiceStatus.HEALTHY,
						responseTime: 5,
					},
				},
				memory: {
					used: 50000000,
					total: 100000000,
					percentage: 50,
				},
			};

			mockAppService.getHealthCheck.mockResolvedValue(mockHealthCheck);

			const result = await appController.getHealth();

			expect(result).toEqual(mockHealthCheck);
			expect(appService.getHealthCheck).toHaveBeenCalled();
		});
	});
});
