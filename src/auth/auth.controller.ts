import { Controller, Post, Logger, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SkipAuth } from './guards/skipAuth.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from 'src/user/model/user-login.dto';

@Controller('auth')
export class AuthController {
	private readonly logger: Logger = new Logger(AuthController.name);
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@SkipAuth()
	@UseGuards(LocalAuthGuard)
	@ApiOperation({ summary: 'Login with credentials and get a JWT' })
	@ApiBody({ description: 'User data', type: UserLoginDto })
	@ApiResponse({ status: 201, description: 'The user is logged in and JWT was created.' })
	@ApiResponse({ status: 401, description: 'Invalid Password' })
	@ApiResponse({ status: 404, description: "User email doesn't exist." })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	public async login(@Body() userLoginDto: UserLoginDto): Promise<any> {
		try {
			return await this.authService.generateJwtToken(userLoginDto);
		} catch (error) {
			throw error;
		}
	}
}
