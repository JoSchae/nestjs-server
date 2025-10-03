import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';

@Injectable()
export class CustomMetricsService {
	private readonly logger = new CustomLoggerService();
	private readonly httpRequestsTotal: Counter<string>;
	private readonly httpRequestDuration: Histogram<string>;
	private readonly activeUsers: Gauge<string>;
	private readonly dbConnections: Gauge<string>;

	constructor() {
		this.logger.setContext(CustomMetricsService.name);
		
		this.logger.log('Initializing custom metrics service', {
			service: 'CustomMetricsService',
			method: 'constructor'
		});

		// HTTP request counter
		this.httpRequestsTotal = new Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
		});

		// HTTP request duration
		this.httpRequestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route'],
			buckets: [0.1, 0.5, 1, 2, 5],
		});

		// Active users gauge
		this.activeUsers = new Gauge({
			name: 'active_users_total',
			help: 'Number of currently active users',
		});

		// Database connections gauge
		this.dbConnections = new Gauge({
			name: 'database_connections_active',
			help: 'Number of active database connections',
		});

		// Register metrics
		register.registerMetric(this.httpRequestsTotal);
		register.registerMetric(this.httpRequestDuration);
		register.registerMetric(this.activeUsers);
		register.registerMetric(this.dbConnections);
		
		this.logger.log('Custom metrics initialized successfully', {
			metricsCount: 4,
			metrics: ['http_requests_total', 'http_request_duration_seconds', 'active_users_total', 'database_connections_active'],
			service: 'CustomMetricsService',
			method: 'constructor'
		});
	}

	incrementHttpRequests(method: string, route: string, statusCode: number) {
		this.logger.log('Incrementing HTTP request counter', {
			httpMethod: method,
			route,
			statusCode,
			service: 'CustomMetricsService',
			method: 'incrementHttpRequests'
		});

		this.httpRequestsTotal.inc({
			method,
			route,
			status_code: statusCode.toString(),
		});
	}

	recordHttpRequestDuration(method: string, route: string, duration: number) {
		this.logger.log('Recording HTTP request duration', {
			httpMethod: method,
			route,
			duration,
			service: 'CustomMetricsService',
			method: 'recordHttpRequestDuration'
		});

		this.httpRequestDuration.observe({ method, route }, duration);
	}

	setActiveUsers(count: number) {
		this.logger.log('Updating active users count', {
			count,
			service: 'CustomMetricsService',
			method: 'setActiveUsers'
		});

		this.activeUsers.set(count);
	}

	setDbConnections(count: number) {
		this.logger.log('Updating database connections count', {
			count,
			service: 'CustomMetricsService',
			method: 'setDbConnections'
		});

		this.dbConnections.set(count);
	}
}
