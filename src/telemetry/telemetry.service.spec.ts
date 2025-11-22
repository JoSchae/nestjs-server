import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TelemetryService } from './telemetry.service';
import { TelemetryEvent } from './schemas/telemetry-event.schema';

describe('TelemetryService', () => {
	let service: TelemetryService;
	let mockModel: any;

	const mockTelemetryEvent = {
		_id: 'test-id',
		userId: 'user-123',
		timestamp: new Date(),
		eventType: 'app.started',
		appName: 'test-app',
		appVersion: '1.0.0',
		os: 'linux',
		metadata: { test: 'data' },
		save: jest.fn().mockResolvedValue(this),
	};

	beforeEach(async () => {
		// Mock the Model constructor function
		mockModel = jest.fn().mockImplementation(() => ({
			save: jest.fn().mockResolvedValue(mockTelemetryEvent),
		}));

		// Add static methods to the mock
		mockModel.find = jest.fn();
		mockModel.findOne = jest.fn();
		mockModel.findById = jest.fn();
		mockModel.create = jest.fn();
		mockModel.insertMany = jest.fn();
		mockModel.aggregate = jest.fn();
		mockModel.deleteMany = jest.fn();
		mockModel.exec = jest.fn();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TelemetryService,
				{
					provide: getModelToken(TelemetryEvent.name),
					useValue: mockModel,
				},
			],
		}).compile();

		service = module.get<TelemetryService>(TelemetryService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
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

			const mockSave = jest.fn().mockResolvedValue(mockTelemetryEvent);
			mockModel.mockReturnValue({
				save: mockSave,
			});

			const result = await service.createEvent(eventDto);
			expect(result).toBeDefined();
			expect(mockSave).toHaveBeenCalled();
		});
	});

	describe('createBatch', () => {
		it('should create multiple events successfully', async () => {
			const events = [
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
			];

			mockModel.insertMany = jest.fn().mockResolvedValue([{}, {}]);

			const result = await service.createBatch(events);
			expect(result.success).toBe(2);
			expect(result.failed).toBe(0);
		});

		it('should handle partial failures', async () => {
			const events = [
				{
					timestamp: '2025-11-22T10:30:45.123Z',
					eventType: 'app.started',
					appName: 'test-app',
					appVersion: '1.0.0',
					os: 'linux' as const,
				},
			];

			const error: any = new Error('Partial failure');
			error.writeErrors = [{ index: 0 }];
			mockModel.insertMany = jest.fn().mockRejectedValue(error);

			const result = await service.createBatch(events);
			expect(result.failed).toBeGreaterThan(0);
		});
	});

	describe('queryEvents', () => {
		it('should query events with filters', async () => {
			const mockEvents = [mockTelemetryEvent];

			mockModel.find = jest.fn().mockReturnValue({
				sort: jest.fn().mockReturnValue({
					limit: jest.fn().mockReturnValue({
						skip: jest.fn().mockReturnValue({
							exec: jest.fn().mockResolvedValue(mockEvents),
						}),
					}),
				}),
			});

			const result = await service.queryEvents({
				userId: 'user-123',
				limit: 10,
			});

			expect(result).toEqual(mockEvents);
			expect(mockModel.find).toHaveBeenCalled();
		});
	});

	describe('cleanupOldEvents', () => {
		it('should delete old events', async () => {
			mockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });

			const result = await service.cleanupOldEvents(90);
			expect(result).toBe(5);
			expect(mockModel.deleteMany).toHaveBeenCalled();
		});
	});
});
