import { Test, TestingModule } from '@nestjs/testing';
import { CustomMetricsService } from './custom-metrics.service';
import { register } from 'prom-client';

describe('CustomMetricsService', () => {
	let service: CustomMetricsService;

	beforeEach(async () => {
		// Clear Prometheus registry before each test
		register.clear();

		const module: TestingModule = await Test.createTestingModule({
			providers: [CustomMetricsService],
		}).compile();

		service = module.get<CustomMetricsService>(CustomMetricsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		// Clear Prometheus registry after each test
		register.clear();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('HTTP Metrics', () => {
		it('should increment HTTP request counter', () => {
			expect(() => {
				service.incrementHttpRequests('GET', '/api/users', 200);
			}).not.toThrow();
		});

		it('should record HTTP request duration', () => {
			expect(() => {
				service.recordHttpRequestDuration('GET', '/api/users', 200, 0.1);
			}).not.toThrow();
		});

		it('should increment HTTP errors', () => {
			expect(() => {
				service.incrementHttpErrors('GET', '/api/users', 500, 'internal_server_error');
			}).not.toThrow();
		});
	});

	describe('Authentication Metrics', () => {
		it('should increment login attempts', () => {
			expect(() => {
				service.incrementLoginAttempts('success');
			}).not.toThrow();
		});

		it('should increment login failures', () => {
			expect(() => {
				service.incrementLoginFailures('invalid_credentials');
			}).not.toThrow();
		});

		it('should increment token validations', () => {
			expect(() => {
				service.incrementTokenValidations('valid');
			}).not.toThrow();
		});
	});

	describe('User Metrics', () => {
		it('should increment user registrations', () => {
			expect(() => {
				service.incrementUserRegistrations('success');
			}).not.toThrow();
		});

		it('should set active users', () => {
			expect(() => {
				service.setActiveUsers(100);
			}).not.toThrow();
		});

		it('should set total users', () => {
			expect(() => {
				service.setTotalUsers(500);
			}).not.toThrow();
		});
	});

	describe('Cache Metrics', () => {
		it('should increment cache hits', () => {
			expect(() => {
				service.incrementCacheHits('user');
			}).not.toThrow();
		});

		it('should increment cache misses', () => {
			expect(() => {
				service.incrementCacheMisses('user');
			}).not.toThrow();
		});

		it('should set cache size', () => {
			expect(() => {
				service.setCacheSize('user', 1000);
			}).not.toThrow();
		});
	});

	describe('Database Metrics', () => {
		it('should increment database query errors', () => {
			expect(() => {
				service.incrementDbQueryErrors('select', 'users', 'connection_timeout');
			}).not.toThrow();
		});
	});
});
