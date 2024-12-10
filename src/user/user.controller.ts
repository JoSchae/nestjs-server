import { ConflictException, Controller, Get, Logger, Post, Request, Response, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/user/model/user.model';
import { AdminAuthGuard } from 'src/auth/guards/admin-auth.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
	logger: Logger = new Logger(UserController.name);
	constructor(private readonly usersService: UserService) {}

	@Post('create')
	@UseGuards(AdminAuthGuard)
	@ApiOperation({ summary: 'Create a new user' })
	@ApiBody({ description: 'User data', type: User })
	@ApiResponse({ status: 201, description: 'The user has been successfully created.' })
	@ApiResponse({ status: 401, description: 'User unauthorized' })
	@ApiResponse({ status: 409, description: 'User already exists.' })
	public async create(@Request() req: any, @Response() res): Promise<any> {
		this.logger.log(`Creating user ${JSON.stringify(req.body)}`);
		const newUser = req.body;
		try {
			const query = { email: newUser.email };
			const isUser = await this.usersService.findOneByEmail(query);
			if (!!isUser) {
				throw new ConflictException('User already exists');
			}
			const user = await this.usersService.create(newUser);
			return res.status(201).json(user);
		} catch (error) {
			this.logger.error(`Error creating user ${JSON.stringify(error)}`);
			return res.status(409).json(error);
		}
	}

	@Get('profile')
	@ApiOperation({ summary: 'Get user profile' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'The user profile has been successfully retrieved.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	public async getProfile(@Request() req: any, @Response() res): Promise<any> {
		this.logger.log(`Getting user profile...}`);
		try {
			const authHeader = req.headers.authorization;
			const token = authHeader ? authHeader.split(' ')[1] : null;
			this.logger.log(`JWT Token: ${token}`);
			this.logger.log(`Getting user profile ${JSON.stringify(req.user)}`);
			const user = await this.usersService.findOneByEmail({ email: req.user.email }, false);
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error getting user profile ${error}`);
			res.status(500).json(error);
		}
	}
}
