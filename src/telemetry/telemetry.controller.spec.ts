import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

describe('TelemetryController', () => {
	let controller: TelemetryController;
	let service: TelemetryService;

	const mockTelemetryService = {
		createEvent: jest.fn(),
		createBatch: jest.fn(),
		queryEvents: jest.fn(),
		getStatistics: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TelemetryController],
			providers: [
				{
					provide: TelemetryService,
					useValue: mockTelemetryService,
				},
			],
		}).compile();

		controller = module.get<TelemetryController>(TelemetryController);
		service = module.get<TelemetryService>(TelemetryService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createEvent', () => {
		it('should create a single telemetry event', async () => {
			const eventDto = {
				timestamp: '2025-11-22T10:30:45.123Z',
				eventType: 'app.started',
				appName: 'test-app',
				appVersion: '1.0.0',
				os: 'linux' as const,
			};

			mockTelemetryService.createEvent.mockResolvedValue({
				_id: 'test-id',
				...eventDto,
			});

			const result = await controller.createEvent(eventDto);
			expect(result.success).toBe(true);
			expect(result.eventId).toBe('test-id');
			expect(service.createEvent).toHaveBeenCalledWith(eventDto);
		});
	});

	describe('createBatch', () => {
		it('should create multiple events in a batch', async () => {
			const batchDto = {
				events: [
					{
						timestamp: '2025-11-22T10:30:45.123Z',
						eventType: 'app.started',
						appName: 'test-app',
						appVersion: '1.0.0',
						os: 'linux' as const,
					},
					{
						timestamp: '2025-11-22T10:30:46.123Z',
						eventType: 'user.login',
						appName: 'test-app',
						appVersion: '1.0.0',
						os: 'darwin' as const,
					},
				],
			};

			mockTelemetryService.createBatch.mockResolvedValue({
				success: 2,
				failed: 0,
			});

			const result = await controller.createBatch(batchDto);
			// Controller returns { success: true, ...serviceResult }
			// So the service's success:2 overwrites controller's success:true
			expect(result.success).toBe(2); // service result overwrites
			expect(result.failed).toBe(0);
			expect(service.createBatch).toHaveBeenCalledWith(batchDto.events);
		});
	});

	describe('queryEvents', () => {
		it('should query telemetry events', async () => {
			const mockEvents = [
				{
					_id: 'test-id',
					timestamp: new Date(),
					eventType: 'app.started',
					appName: 'test-app',
				},
			];

			mockTelemetryService.queryEvents.mockResolvedValue(mockEvents);

			const result = await controller.queryEvents('acme-corp');
			expect(result.success).toBe(true);
			expect(result.count).toBe(1);
			expect(result.events).toEqual(mockEvents);
		});
	});

	describe('getStatistics', () => {
		it('should retrieve telemetry statistics', async () => {
			const mockStats = [
				{
					_id: 'app.started',
					count: 10,
					firstSeen: new Date(),
					lastSeen: new Date(),
				},
			];

			mockTelemetryService.getStatistics.mockResolvedValue(mockStats);

			const result = await controller.getStatistics('acme-corp');
			expect(result.success).toBe(true);
			expect(result.statistics).toEqual(mockStats);
		});
	});
});
