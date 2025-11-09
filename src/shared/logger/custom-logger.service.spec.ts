import { CustomLoggerService } from './custom-logger.service';

describe('CustomLoggerService', () => {
	let service: CustomLoggerService;

	beforeEach(() => {
		service = new CustomLoggerService();
		service.setContext('TestContext');
	});

	describe('Sensitive Data Redaction', () => {
		it('should redact password fields in logs', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('User created', { email: 'test@example.com', password: 'secret123' });

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			expect(logOutput).toContain('[REDACTED]');
			expect(logOutput).not.toContain('secret123');

			consoleSpy.mockRestore();
		});

		it('should redact token fields in logs', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('Auth attempt', { accessToken: 'jwt-token-here', userId: '123' });

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			expect(logOutput).toContain('[REDACTED]');
			expect(logOutput).not.toContain('jwt-token-here');

			consoleSpy.mockRestore();
		});

		it('should redact authorization headers in nested objects', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('Request received', {
				headers: {
					authorization: 'Bearer secret-token',
					'content-type': 'application/json',
				},
			});

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			expect(logOutput).toContain('[REDACTED]');
			expect(logOutput).not.toContain('secret-token');
			expect(logOutput).toContain('application/json'); // Non-sensitive data should remain

			consoleSpy.mockRestore();
		});

		it('should redact sensitive fields in arrays', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('Multiple users', [
				{ email: 'user1@test.com', password: 'pass1' },
				{ email: 'user2@test.com', password: 'pass2' },
			]);

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			expect(logOutput).toContain('[REDACTED]');
			expect(logOutput).not.toContain('pass1');
			expect(logOutput).not.toContain('pass2');

			consoleSpy.mockRestore();
		});

		it('should not redact non-sensitive data', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('User data', { email: 'test@example.com', name: 'John Doe', age: 30 });

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			expect(logOutput).toContain('test@example.com');
			expect(logOutput).toContain('John Doe');
			expect(logOutput).not.toContain('[REDACTED]');

			consoleSpy.mockRestore();
		});

		it('should redact multiple sensitive fields', () => {
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			service.warn('Security alert', {
				email: 'admin@test.com',
				password: 'admin123',
				apiKey: 'key-12345',
				secret: 'secret-data',
			});

			expect(consoleSpy).toHaveBeenCalled();
			const logOutput = consoleSpy.mock.calls[0][0];
			const redactedCount = (logOutput.match(/\[REDACTED\]/g) || []).length;
			expect(redactedCount).toBe(3); // password, apiKey, secret should be redacted
			expect(logOutput).not.toContain('admin123');
			expect(logOutput).not.toContain('key-12345');
			expect(logOutput).not.toContain('secret-data');

			consoleSpy.mockRestore();
		});
	});

	describe('Log Level Filtering', () => {
		it('should log info messages when level is info', () => {
			CustomLoggerService.setLogLevel('info');
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			service.log('Test message');

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should not log debug messages when level is info', () => {
			CustomLoggerService.setLogLevel('info');
			const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

			service.debug('Debug message');

			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
