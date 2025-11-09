import { plainToClass } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, validateSync } from 'class-validator';

export class EnvironmentVariables {
	@IsString()
	@IsNotEmpty()
	@MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
	JWT_SECRET: string;

	@IsString()
	@IsNotEmpty()
	JWT_EXPIRATION: string = '3600s';
}

export function validate(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});

	const errors = validateSync(validatedConfig, { skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(`Environment validation failed: ${errors.toString()}`);
	}
	return validatedConfig;
}
