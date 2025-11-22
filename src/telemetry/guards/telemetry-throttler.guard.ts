import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Custom throttler guard for telemetry endpoints
 * Rate limits by userId extracted from JWT instead of IP address
 */
@Injectable()
export class TelemetryThrottlerGuard extends ThrottlerGuard {
	constructor(
		options: any,
		storageService: any,
		reflector: any,
		private readonly configService: ConfigService,
	) {
		super(options, storageService, reflector);
	}

	/**
	 * Generate a unique key for rate limiting based on userId from JWT
	 */
	protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
		const request = context.switchToHttp().getRequest();
		const user = request.user; // JWT payload attached by JwtAuthGuard

		// Use userId from JWT if available, otherwise fall back to IP
		const identifier = user?.userId || this.getRequestIP(request);

		return `telemetry:${identifier}:${suffix}:${name}`;
	}

	/**
	 * Get IP address from request (fallback if no userId)
	 */
	private getRequestIP(request: any): string {
		return request.ip || request.connection?.remoteAddress || 'unknown';
	}

	/**
	 * Custom error message for telemetry rate limiting
	 */
	protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
		const request = context.switchToHttp().getRequest();
		const user = request.user;
		const userId = user?.userId || 'unknown';

		throw new ThrottlerException(`Rate limit exceeded for user: ${userId}. Please try again later.`);
	}
}
