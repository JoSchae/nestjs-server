import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './auth/skipAuth.decorator';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@SkipAuth()
	@Get()
	getPing(): string {
		return this.appService.getPing();
	}
}
