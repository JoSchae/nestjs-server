import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TelemetryService } from './telemetry.service';
import { TelemetryEventDto } from './dto/telemetry-event.dto';
import { BatchTelemetryDto } from './dto/batch-telemetry.dto';
import { CustomLoggerService } from 'src/shared/logger/custom-logger.service';
import { CustomMetricsService } from 'src/metrics/custom-metrics.service';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
	private readonly logger = new CustomLoggerService();

	constructor(
		private readonly telemetryService: TelemetryService,
		private readonly metricsService: CustomMetricsService,
	) {
		this.logger.setContext(TelemetryController.name);
	}

	@Post('event')
	@Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 requests per minute per user
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Submit a single telemetry event' })
	@ApiResponse({ status: 201, description: 'Event stored successfully' })
	@ApiResponse({ status: 400, description: 'Invalid event data' })
	@ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
	@ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
	async createEvent(@Body() eventDto: TelemetryEventDto) {
		this.logger.log('Received telemetry event', {
			eventType: eventDto.eventType,
			appName: eventDto.appName,
			userId: eventDto.userId,
		});

		// Record Prometheus metric
		this.metricsService.recordTelemetryEvent(
			eventDto.userId, // nestjs-server uses userId instead of companyId
			eventDto.eventType,
			eventDto.appName,
		);

		const event = await this.telemetryService.createEvent(eventDto);
		return {
			success: true,
			eventId: event._id,
		};
	}

	@Post('batch')
	@Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 batch requests per minute per user
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Submit multiple telemetry events in a batch' })
	@ApiResponse({ status: 201, description: 'Batch stored successfully' })
	@ApiResponse({ status: 400, description: 'Invalid batch data' })
	@ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
	@ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
	async createBatch(@Body() batchDto: BatchTelemetryDto) {
		this.logger.log(`Received telemetry batch: ${batchDto.events.length} events`);

		// Record Prometheus metric - use first event's userId for batch metric
		if (batchDto.events.length > 0) {
			this.metricsService.recordTelemetryBatch(batchDto.events[0].userId, batchDto.events.length);
		}

		const result = await this.telemetryService.createBatch(batchDto.events);
		return {
			success: true,
			...result,
		};
	}

	@Get('events')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Query telemetry events (requires authentication)' })
	@ApiQuery({ name: 'userId', required: false })
	@ApiQuery({ name: 'appName', required: false })
	@ApiQuery({ name: 'eventType', required: false })
	@ApiQuery({ name: 'startDate', required: false })
	@ApiQuery({ name: 'endDate', required: false })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'skip', required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Events retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
	async queryEvents(
		@Query('userId') userId?: string,
		@Query('appName') appName?: string,
		@Query('eventType') eventType?: string,
		@Query('startDate') startDate?: string,
		@Query('endDate') endDate?: string,
		@Query('limit') limit?: number,
		@Query('skip') skip?: number,
	) {
		this.logger.log('Querying telemetry events');

		const filters: any = {
			userId,
			appName,
			eventType,
			limit: limit ? parseInt(limit.toString(), 10) : undefined,
			skip: skip ? parseInt(skip.toString(), 10) : undefined,
		};

		if (startDate) filters.startDate = new Date(startDate);
		if (endDate) filters.endDate = new Date(endDate);

		const events = await this.telemetryService.queryEvents(filters);
		return {
			success: true,
			count: events.length,
			events,
		};
	}

	@Get('statistics')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get telemetry statistics (requires authentication)' })
	@ApiQuery({ name: 'appName', required: false })
	@ApiQuery({ name: 'startDate', required: false })
	@ApiQuery({ name: 'endDate', required: false })
	@ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
	async getStatistics(
		@Query('appName') appName?: string,
		@Query('startDate') startDate?: string,
		@Query('endDate') endDate?: string,
	) {
		this.logger.log('Retrieving telemetry statistics');

		const filters: any = {
			appName,
		};

		if (startDate) filters.startDate = new Date(startDate);
		if (endDate) filters.endDate = new Date(endDate);

		const stats = await this.telemetryService.getStatistics(filters);
		return {
			success: true,
			statistics: stats,
		};
	}
}
