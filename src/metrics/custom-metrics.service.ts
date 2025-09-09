import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class CustomMetricsService {
	private readonly httpRequestsTotal: Counter<string>;
	private readonly httpRequestDuration: Histogram<string>;
	private readonly activeUsers: Gauge<string>;
	private readonly dbConnections: Gauge<string>;

	constructor() {
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
	}

	incrementHttpRequests(method: string, route: string, statusCode: number) {
		this.httpRequestsTotal.inc({
			method,
			route,
			status_code: statusCode.toString(),
		});
	}

	recordHttpRequestDuration(method: string, route: string, duration: number) {
		this.httpRequestDuration.observe({ method, route }, duration);
	}

	setActiveUsers(count: number) {
		this.activeUsers.set(count);
	}

	setDbConnections(count: number) {
		this.dbConnections.set(count);
	}
}
