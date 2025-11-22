import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';

@Injectable()
export class CustomMetricsService {
	private readonly logger = new CustomLoggerService();

	// HTTP Metrics
	private readonly httpRequestsTotal: Counter<string>;
	private readonly httpRequestDuration: Histogram<string>;
	private readonly httpErrorsTotal: Counter<string>;

	// Authentication Metrics
	private readonly authLoginAttempts: Counter<string>;
	private readonly authLoginFailures: Counter<string>;
	private readonly authTokenValidations: Counter<string>;

	// User Metrics
	private readonly userRegistrations: Counter<string>;
	private readonly activeUsers: Gauge<string>;
	private readonly totalUsers: Gauge<string>;

	// Database Metrics
	private readonly dbConnections: Gauge<string>;
	private readonly dbConnectionsAvailable: Gauge<string>;
	private readonly dbQueryDuration: Histogram<string>;
	private readonly dbQueryErrors: Counter<string>;

	// Cache Metrics
	private readonly cacheHits: Counter<string>;
	private readonly cacheMisses: Counter<string>;
	private readonly cacheSize: Gauge<string>;

	// Telemetry Metrics
	private readonly telemetryEventsTotal: Counter<string>;
	private readonly telemetryBatchesTotal: Counter<string>;
	private readonly telemetryEventsStoredTotal: Gauge<string>;

	constructor() {
		this.logger.setContext(CustomMetricsService.name);

		this.logger.log('Initializing custom metrics service', {
			service: 'CustomMetricsService',
			method: 'constructor',
		});

		// HTTP Metrics
		this.httpRequestsTotal = new Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
		});

		this.httpRequestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status_code'],
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
		});

		this.httpErrorsTotal = new Counter({
			name: 'http_errors_total',
			help: 'Total number of HTTP errors',
			labelNames: ['method', 'route', 'status_code', 'error_type'],
		});

		// Authentication Metrics
		this.authLoginAttempts = new Counter({
			name: 'auth_login_attempts_total',
			help: 'Total number of login attempts',
			labelNames: ['status'],
		});

		this.authLoginFailures = new Counter({
			name: 'auth_login_failures_total',
			help: 'Total number of failed login attempts',
			labelNames: ['reason'],
		});

		this.authTokenValidations = new Counter({
			name: 'auth_token_validations_total',
			help: 'Total number of token validations',
			labelNames: ['status'],
		});

		// User Metrics
		this.userRegistrations = new Counter({
			name: 'user_registrations_total',
			help: 'Total number of user registrations',
			labelNames: ['status'],
		});

		this.activeUsers = new Gauge({
			name: 'active_users_total',
			help: 'Number of currently active users',
		});

		this.totalUsers = new Gauge({
			name: 'users_total',
			help: 'Total number of registered users',
		});

		// Database Metrics
		this.dbConnections = new Gauge({
			name: 'database_connections_active',
			help: 'Number of active database connections',
		});

		this.dbConnectionsAvailable = new Gauge({
			name: 'database_connections_available',
			help: 'Number of available database connections',
		});

		this.dbQueryDuration = new Histogram({
			name: 'database_query_duration_seconds',
			help: 'Duration of database queries in seconds',
			labelNames: ['operation', 'collection'],
			buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
		});

		this.dbQueryErrors = new Counter({
			name: 'database_query_errors_total',
			help: 'Total number of database query errors',
			labelNames: ['operation', 'collection', 'error_type'],
		});

		// Cache Metrics
		this.cacheHits = new Counter({
			name: 'cache_hits_total',
			help: 'Total number of cache hits',
			labelNames: ['cache_key'],
		});

		this.cacheMisses = new Counter({
			name: 'cache_misses_total',
			help: 'Total number of cache misses',
			labelNames: ['cache_key'],
		});

		this.cacheSize = new Gauge({
			name: 'cache_size_bytes',
			help: 'Current size of cache in bytes',
			labelNames: ['cache_name'],
		});

		// Telemetry Metrics
		this.telemetryEventsTotal = new Counter({
			name: 'telemetry_events_total',
			help: 'Total number of telemetry events received',
			labelNames: ['company_id', 'event_type', 'app_name'],
		});

		this.telemetryBatchesTotal = new Counter({
			name: 'telemetry_batches_total',
			help: 'Total number of telemetry batch requests',
			labelNames: ['company_id'],
		});

		this.telemetryEventsStoredTotal = new Gauge({
			name: 'telemetry_events_stored_total',
			help: 'Total number of telemetry events currently stored in database',
			labelNames: ['company_id', 'event_type'],
		});

		// Register all metrics
		register.registerMetric(this.httpRequestsTotal);
		register.registerMetric(this.httpRequestDuration);
		register.registerMetric(this.httpErrorsTotal);
		register.registerMetric(this.authLoginAttempts);
		register.registerMetric(this.authLoginFailures);
		register.registerMetric(this.authTokenValidations);
		register.registerMetric(this.userRegistrations);
		register.registerMetric(this.activeUsers);
		register.registerMetric(this.totalUsers);
		register.registerMetric(this.dbConnections);
		register.registerMetric(this.dbConnectionsAvailable);
		register.registerMetric(this.dbQueryDuration);
		register.registerMetric(this.dbQueryErrors);
		register.registerMetric(this.cacheHits);
		register.registerMetric(this.cacheMisses);
		register.registerMetric(this.cacheSize);
		register.registerMetric(this.telemetryEventsTotal);
		register.registerMetric(this.telemetryBatchesTotal);
		register.registerMetric(this.telemetryEventsStoredTotal);

		this.logger.log('Custom metrics initialized successfully', {
			metricsCount: 19,
			metrics: [
				'http_requests_total',
				'http_request_duration_seconds',
				'http_errors_total',
				'auth_login_attempts_total',
				'auth_login_failures_total',
				'auth_token_validations_total',
				'user_registrations_total',
				'active_users_total',
				'users_total',
				'database_connections_active',
				'database_connections_available',
				'database_query_duration_seconds',
				'database_query_errors_total',
				'cache_hits_total',
				'cache_misses_total',
				'cache_size_bytes',
				'telemetry_events_total',
				'telemetry_batches_total',
				'telemetry_events_stored_total',
			],
			service: 'CustomMetricsService',
			method: 'constructor',
		});
	}

	// HTTP Metrics Methods
	incrementHttpRequests(method: string, route: string, statusCode: number) {
		this.httpRequestsTotal.inc({
			method,
			route,
			status_code: statusCode.toString(),
		});
	}

	recordHttpRequestDuration(method: string, route: string, statusCode: number, duration: number) {
		this.httpRequestDuration.observe(
			{
				method,
				route,
				status_code: statusCode.toString(),
			},
			duration,
		);
	}

	incrementHttpErrors(method: string, route: string, statusCode: number, errorType: string) {
		this.httpErrorsTotal.inc({
			method,
			route,
			status_code: statusCode.toString(),
			error_type: errorType,
		});
	}

	// Authentication Metrics Methods
	incrementLoginAttempts(status: 'success' | 'failure') {
		this.authLoginAttempts.inc({ status });
	}

	incrementLoginFailures(reason: string) {
		this.authLoginFailures.inc({ reason });
	}

	incrementTokenValidations(status: 'valid' | 'invalid' | 'expired') {
		this.authTokenValidations.inc({ status });
	}

	// User Metrics Methods
	incrementUserRegistrations(status: 'success' | 'failure') {
		this.userRegistrations.inc({ status });
	}

	setActiveUsers(count: number) {
		this.activeUsers.set(count);
	}

	setTotalUsers(count: number) {
		this.totalUsers.set(count);
	}

	// Database Metrics Methods
	setDbConnections(active: number, available?: number) {
		this.dbConnections.set(active);
		if (available !== undefined) {
			this.dbConnectionsAvailable.set(available);
		}
	}

	recordDbQueryDuration(operation: string, collection: string, duration: number) {
		this.dbQueryDuration.observe({ operation, collection }, duration);
	}

	incrementDbQueryErrors(operation: string, collection: string, errorType: string) {
		this.dbQueryErrors.inc({ operation, collection, error_type: errorType });
	}

	// Cache Metrics Methods
	incrementCacheHits(cacheKey: string) {
		this.cacheHits.inc({ cache_key: cacheKey });
	}

	incrementCacheMisses(cacheKey: string) {
		this.cacheMisses.inc({ cache_key: cacheKey });
	}

	setCacheSize(cacheName: string, sizeBytes: number) {
		this.cacheSize.set({ cache_name: cacheName }, sizeBytes);
	}

	// Telemetry Metrics Methods
	recordTelemetryEvent(companyId: string, eventType: string, appName: string) {
		this.telemetryEventsTotal.inc({
			company_id: companyId,
			event_type: eventType,
			app_name: appName,
		});
	}

	recordTelemetryBatch(companyId: string, eventCount: number) {
		this.telemetryBatchesTotal.inc({ company_id: companyId }, eventCount);
	}

	setStoredTelemetryEvents(companyId: string, eventType: string, count: number) {
		this.telemetryEventsStoredTotal.set(
			{
				company_id: companyId,
				event_type: eventType,
			},
			count,
		);
	}
}
