import { ConflictException, Controller, Logger, Post, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	logger: Logger = new Logger(UsersController.name);
	constructor(private readonly usersService: UsersService) {}

	@Post('create')
	async create(@Request() req: any): Promise<any> {
		this.logger.log(`Creating user ${req.body}`);
		const newUser = req.body;
		try {
			const query = { email: newUser.email };
			const isUser = await this.usersService.findOneByEmail(query);
			if (!!isUser) {
				throw new ConflictException('User already exists');
			}
			const user = await this.usersService.create(newUser);
			return user;
		} catch (error) {
			this.logger.error(`Error creating user ${error}`);
			throw error;
		}
	}
}
