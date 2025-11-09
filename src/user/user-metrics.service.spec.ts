import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserMetricsService } from './user-metrics.service';
import { User } from './model/user.model';
import { CustomMetricsService } from '../metrics/custom-metrics.service';

describe('UserMetricsService', () => {
	let service: UserMetricsService;
	let userModel: any;
	let metricsService: CustomMetricsService;

	const mockUserModel = {
		countDocuments: jest.fn(),
	};

	const mockMetricsService = {
		setTotalUsers: jest.fn(),
		setActiveUsers: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserMetricsService,
				{
					provide: getModelToken(User.name),
					useValue: mockUserModel,
				},
				{
					provide: CustomMetricsService,
					useValue: mockMetricsService,
				},
			],
		}).compile();

		service = module.get<UserMetricsService>(UserMetricsService);
		userModel = module.get(getModelToken(User.name));
		metricsService = module.get<CustomMetricsService>(CustomMetricsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('updateUserMetrics', () => {
		it('should update total and active user metrics', async () => {
			mockUserModel.countDocuments.mockResolvedValueOnce(100); // total users
			mockUserModel.countDocuments.mockResolvedValueOnce(75); // active users

			await service.updateUserMetrics();

			expect(userModel.countDocuments).toHaveBeenCalledTimes(2);
			expect(metricsService.setTotalUsers).toHaveBeenCalledWith(100);
			expect(metricsService.setActiveUsers).toHaveBeenCalledWith(75);
		});

		it('should handle errors gracefully', async () => {
			mockUserModel.countDocuments.mockRejectedValue(new Error('Database error'));

			await expect(service.updateUserMetrics()).resolves.not.toThrow();
		});
	});

	describe('onModuleInit', () => {
		it('should update metrics on module initialization', async () => {
			mockUserModel.countDocuments.mockResolvedValueOnce(50); // total users
			mockUserModel.countDocuments.mockResolvedValueOnce(40); // active users

			await service.onModuleInit();

			expect(userModel.countDocuments).toHaveBeenCalled();
			expect(metricsService.setTotalUsers).toHaveBeenCalled();
			expect(metricsService.setActiveUsers).toHaveBeenCalled();
		});
	});
});
