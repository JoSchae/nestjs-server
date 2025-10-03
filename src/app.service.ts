import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from './shared/logger/custom-logger.service';

@Injectable()
export class AppService {
	private readonly logger = new CustomLoggerService();

	constructor() {
		this.logger.setContext(AppService.name);
	}

	getPing(): string {
		this.logger.log('Health check requested', {
			service: 'AppService',
			method: 'getPing',
			timestamp: new Date().toISOString()
		});
		return 'API is available';
	}
}
