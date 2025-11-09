import { Controller, Get } from '@nestjs/common';
import { AppService, HealthCheckResponse, HealthStatus, ServiceStatus } from './app.service';
import { SkipAuth } from './auth/guards/skipAuth.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// Re-export enums for external use
export { HealthStatus, ServiceStatus };

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	@SkipAuth()
	@Throttle({ default: { ttl: 60000, limit: 30 } }) // 30 requests per minute
	@ApiOperation({ summary: 'Health check endpoint with database status' })
	@ApiResponse({
		status: 200,
		description: 'Service health status including database connectivity and memory usage',
		schema: {
			example: {
				status: 'healthy',
				timestamp: '2025-10-25T10:30:00.000Z',
				service: 'nestjs-server',
				uptime: 3600,
				checks: {
					database: {
						status: 'healthy',
						responseTime: 5,
						message: 'Connected',
						connections: {
							active: 3,
							available: 7,
							max: 10,
						},
					},
					memory: {
						used: '120MB',
						total: '512MB',
						percentage: 23,
					},
				},
			},
		},
	})
	@ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded (30/min).' })
	async getHealth(): Promise<HealthCheckResponse> {
		return await this.appService.getHealthCheck();
	}
}
