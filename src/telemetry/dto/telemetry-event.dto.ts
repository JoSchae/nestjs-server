import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsISO8601, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Generic telemetry event DTO
 * Accepts any event type and flexible metadata
 */
export class TelemetryEventDto {
	@ApiPropertyOptional({ description: 'User ID (optional, depending on privacy requirements)', example: 'user-123' })
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiPropertyOptional({ description: 'Session ID (optional)', example: 'session-abc-123' })
	@IsOptional()
	@IsString()
	sessionId?: string;

	@ApiProperty({ description: 'ISO 8601 timestamp', example: '2025-11-22T10:30:45.123Z' })
	@IsISO8601()
	timestamp: string;

	@ApiProperty({
		description: 'Event type (e.g., "user.login", "app.started", "feature.used")',
		example: 'app.started',
	})
	@IsString()
	eventType: string;

	@ApiPropertyOptional({
		description: 'Application name/identifier',
		example: 'mkcli',
	})
	@IsOptional()
	@IsString()
	appName?: string;

	@ApiPropertyOptional({ description: 'Application version', example: '1.2.3' })
	@IsOptional()
	@IsString()
	appVersion?: string;

	@ApiPropertyOptional({ description: 'Operating system', example: 'linux' })
	@IsOptional()
	@IsString()
	os?: string;

	@ApiPropertyOptional({ description: 'Platform/environment', example: 'production' })
	@IsOptional()
	@IsString()
	platform?: string;

	@ApiPropertyOptional({
		description: 'Additional event metadata (flexible key-value pairs)',
		example: { feature: 'export', duration: 1234, itemCount: 5 },
	})
	@IsOptional()
	@IsObject()
	metadata?: Record<string, any>;
}
