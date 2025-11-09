import { Controller, Get, UseGuards, Header, InternalServerErrorException } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { register } from 'prom-client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(PermissionsGuard)
@RequirePermissions('metrics:read')
export class MetricsController {
	private readonly logger = new CustomLoggerService();

	constructor() {
		this.logger.setContext(MetricsController.name);
	}

	@Get()
	@Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 requests per minute
	@Header('Content-Type', register.contentType)
	@ApiOperation({
		summary: 'Get Prometheus metrics for monitoring',
		description: 'Requires metrics:read permission. Intended for dedicated metrics user with long-lived JWT token.',
	})
	@ApiResponse({ status: 200, description: 'Prometheus metrics in text format.' })
	@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
	@ApiResponse({ status: 403, description: 'Forbidden - Missing metrics:read permission.' })
	@ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded (10/min).' })
	@ApiResponse({ status: 500, description: 'Failed to retrieve metrics.' })
	async getMetrics(): Promise<string> {
		try {
			this.logger.log('Generating Prometheus metrics');
			const metrics = await register.metrics();
			this.logger.log('Prometheus metrics generated successfully', {
				metricsLength: metrics.length,
			});
			return metrics;
		} catch (error) {
			this.logger.error('Failed to generate Prometheus metrics', error.stack);
			throw new InternalServerErrorException('Failed to retrieve metrics');
		}
	}
}
