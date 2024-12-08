import { Controller, Post, Logger, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SkipAuth } from './skipAuth.decorator';

@Controller('auth')
export class AuthController {
	private readonly logger: Logger = new Logger(AuthController.name);
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@SkipAuth()
	@UseGuards(LocalAuthGuard)
	async login(@Request() req): Promise<any> {
		try {
			console.log('req.user', req.user);
			return await this.authService.generateJwtToken(req.user);
		} catch (error) {
			throw error;
		}
	}
}
