import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from './shared/logger/custom-logger.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export enum HealthStatus {
	HEALTHY = 'healthy',
	DEGRADED = 'degraded',
	UNHEALTHY = 'unhealthy',
}

export enum ServiceStatus {
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
}

export interface HealthCheckResponse {
	status: HealthStatus;
	timestamp: string;
	service: string;
	uptime: number;
	checks: {
		database: {
			status: ServiceStatus;
			responseTime?: number;
			message?: string;
			connections?: {
				active: number;
				available: number;
				max: number;
			};
		};
		memory: {
			used: string;
			total: string;
			percentage: number;
		};
	};
}

@Injectable()
export class AppService {
	private readonly logger = new CustomLoggerService();
	private readonly startTime: number;

	constructor(@InjectConnection() private readonly mongoConnection: Connection) {
		this.logger.setContext(AppService.name);
		this.startTime = Date.now();
	}

	getPing(): string {
		this.logger.log('Health check requested', {
			service: 'AppService',
			method: 'getPing',
			timestamp: new Date().toISOString(),
		});
		return 'API is available';
	}

	async getHealthCheck(): Promise<HealthCheckResponse> {
		const dbCheckStart = Date.now();
		let dbStatus: ServiceStatus = ServiceStatus.UNHEALTHY;
		let dbMessage = 'Unknown';
		let dbResponseTime = 0;
		let connectionStats = null;

		try {
			// Check database connection
			const isConnected = this.mongoConnection.readyState === 1;

			if (isConnected) {
				// Perform a simple ping to test actual connectivity
				await this.mongoConnection.db.admin().ping();
				dbResponseTime = Date.now() - dbCheckStart;
				dbStatus = ServiceStatus.HEALTHY;
				dbMessage = 'Connected';

				// Get connection pool stats (simplified for type safety)
				const mongooseClient = (this.mongoConnection as any).client;
				const poolStats = mongooseClient?.options;

				if (poolStats) {
					const inUse = mongooseClient?.topology?.s?.poolStats?.inUse || 0;
					connectionStats = {
						active: inUse,
						available: (poolStats?.maxPoolSize || 10) - inUse,
						max: poolStats?.maxPoolSize || 10,
					};
				}
			} else {
				dbMessage = 'Disconnected';
			}
		} catch (error) {
			dbMessage = error.message || 'Connection failed';
			this.logger.error('Database health check failed', error, {
				service: 'AppService',
				method: 'getHealthCheck',
			});
		}

		// Memory stats
		const memUsage = process.memoryUsage();
		const memoryStats = {
			used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
			total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
			percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
		};

		// Overall health status
		const overallStatus: HealthStatus =
			dbStatus === ServiceStatus.HEALTHY ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;

		const healthCheck: HealthCheckResponse = {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			service: 'nestjs-server',
			uptime: Math.floor((Date.now() - this.startTime) / 1000),
			checks: {
				database: {
					status: dbStatus,
					responseTime: dbResponseTime,
					message: dbMessage,
					...(connectionStats && { connections: connectionStats }),
				},
				memory: memoryStats,
			},
		};

		this.logger.log('Health check completed', {
			service: 'AppService',
			method: 'getHealthCheck',
			status: overallStatus,
			dbStatus,
			dbResponseTime,
		});

		return healthCheck;
	}
}
