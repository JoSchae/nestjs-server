import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { TelemetryEvent } from './schemas/telemetry-event.schema';
import { TelemetryEventDto } from './dto/telemetry-event.dto';
import { CustomLoggerService } from 'src/shared/logger/custom-logger.service';

@Injectable()
export class TelemetryService {
	private readonly logger = new CustomLoggerService();

	constructor(
		@InjectModel(TelemetryEvent.name)
		private telemetryEventModel: Model<TelemetryEvent>,
	) {
		this.logger.setContext(TelemetryService.name);
	}

	/**
	 * Cron job: Cleanup old telemetry data every day at 4:00 AM
	 * Removes events older than 12 months (365 days)
	 */
	@Cron('0 4 * * *', {
		name: 'telemetry-cleanup',
		timeZone: 'Europe/Berlin',
	})
	async handleTelemetryCleanup() {
		this.logger.log('Running scheduled telemetry cleanup...');
		try {
			const deletedCount = await this.cleanupOldEvents(365);
			this.logger.log(`Telemetry cleanup completed: ${deletedCount} events deleted`);
		} catch (error) {
			this.logger.error('Telemetry cleanup failed', error);
		}
	}

	/**
	 * Store a single telemetry event
	 */
	async createEvent(eventDto: TelemetryEventDto): Promise<TelemetryEvent> {
		const event = new this.telemetryEventModel({
			...eventDto,
			timestamp: new Date(eventDto.timestamp),
		});

		const saved = await event.save();
		this.logger.debug(`Telemetry event stored: ${eventDto.eventType}`);
		return saved;
	}

	/**
	 * Store multiple telemetry events in a batch
	 */
	async createBatch(events: TelemetryEventDto[]): Promise<{ success: number; failed: number }> {
		try {
			const documents = events.map((event) => ({
				...event,
				timestamp: new Date(event.timestamp),
			}));

			const result = await this.telemetryEventModel.insertMany(documents, {
				ordered: false, // Continue on errors
			});

			this.logger.log(`Batch telemetry stored: ${result.length} events`);
			return {
				success: result.length,
				failed: events.length - result.length,
			};
		} catch (error) {
			// Handle partial failures in insertMany
			if (error.writeErrors) {
				const successCount = events.length - error.writeErrors.length;
				this.logger.warn(`Partial batch failure: ${successCount}/${events.length} events stored`);
				return {
					success: successCount,
					failed: error.writeErrors.length,
				};
			}

			this.logger.error(`Batch telemetry failed: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Query telemetry events with filters
	 */
	async queryEvents(filters: {
		userId?: string;
		appName?: string;
		eventType?: string;
		startDate?: Date;
		endDate?: Date;
		limit?: number;
		skip?: number;
	}): Promise<TelemetryEvent[]> {
		const query: any = {};

		if (filters.userId) query.userId = filters.userId;
		if (filters.appName) query.appName = filters.appName;
		if (filters.eventType) query.eventType = filters.eventType;

		if (filters.startDate || filters.endDate) {
			query.timestamp = {};
			if (filters.startDate) query.timestamp.$gte = filters.startDate;
			if (filters.endDate) query.timestamp.$lte = filters.endDate;
		}

		return this.telemetryEventModel
			.find(query)
			.sort({ timestamp: -1 })
			.limit(filters.limit || 100)
			.skip(filters.skip || 0)
			.exec();
	}

	/**
	 * Get aggregated statistics
	 */
	async getStatistics(filters: { appName?: string; startDate?: Date; endDate?: Date }): Promise<any> {
		const matchStage: any = {};

		if (filters.appName) matchStage.appName = filters.appName;

		if (filters.startDate || filters.endDate) {
			matchStage.timestamp = {};
			if (filters.startDate) matchStage.timestamp.$gte = filters.startDate;
			if (filters.endDate) matchStage.timestamp.$lte = filters.endDate;
		}

		const pipeline: any[] = [
			{ $match: matchStage },
			{
				$group: {
					_id: '$eventType',
					count: { $sum: 1 },
					firstSeen: { $min: '$timestamp' },
					lastSeen: { $max: '$timestamp' },
				},
			},
			{ $sort: { count: -1 } },
		];

		return this.telemetryEventModel.aggregate(pipeline).exec();
	} /**
	 * Delete old telemetry events (manual cleanup beyond TTL)
	 */
	async cleanupOldEvents(daysOld: number): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);

		const result = await this.telemetryEventModel.deleteMany({
			timestamp: { $lt: cutoffDate },
		});

		this.logger.log(`Cleaned up ${result.deletedCount} telemetry events older than ${daysOld} days`);
		return result.deletedCount;
	}
}
