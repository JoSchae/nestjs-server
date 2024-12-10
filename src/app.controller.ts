import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './auth/guards/skipAuth.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@SkipAuth()
	@ApiOperation({ summary: 'Check if the API is available' })
	getPing(): string {
		return this.appService.getPing();
	}
}
