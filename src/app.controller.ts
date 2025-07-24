import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './auth/guards/skipAuth.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	@SkipAuth()
	@ApiOperation({ summary: 'Health check endpoint' })
	@ApiResponse({ status: 200, description: 'Service is healthy' })
	getHealth(): object {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'nestjs-server',
		};
	}
}
