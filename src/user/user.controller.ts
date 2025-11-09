import {
	ConflictException,
	Controller,
	Delete,
	Get,
	Post,
	Put,
	Request,
	UseGuards,
	Param,
	Body,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/user/model/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequirePermissions } from 'src/auth/decorators/permissions.decorator';
import { CustomLoggerService } from 'src/shared/logger/custom-logger.service';
import { ParseMongoIdPipe } from 'src/shared/pipes/parse-mongo-id.pipe';

@ApiTags('User')
@Controller('user')
export class UserController {
	private readonly logger = new CustomLoggerService();

	constructor(private readonly usersService: UserService) {
		this.logger.setContext(UserController.name);
	}

	@Post('create')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:create')
	@ApiOperation({ summary: 'Create a new user' })
	@ApiBody({ description: 'User data', type: CreateUserDto })
	@ApiResponse({ status: 201, description: 'The user has been successfully created.', type: User })
	@ApiResponse({ status: 401, description: 'User unauthorized' })
	@ApiResponse({ status: 409, description: 'User already exists.' })
	public async create(@Body() createUserDto: CreateUserDto): Promise<User> {
		this.logger.log(`Creating user with email: ${createUserDto.email}`);

		const existingUser = await this.usersService.findOneByEmail({ email: createUserDto.email });
		if (existingUser) {
			throw new ConflictException('User already exists');
		}

		const user = await this.usersService.create(createUserDto);
		const userResponse = user.toObject();
		delete userResponse.password;

		this.logger.log(`User created successfully with ID: ${user._id}`);
		return userResponse as User;
	}

	@Get('all')
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:read')
	@ApiOperation({ summary: 'Get all users' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Users retrieved successfully.', type: [User] })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	public async getAllUsers(): Promise<User[]> {
		this.logger.log('Getting all users');
		const users = await this.usersService.findAll();
		this.logger.log(`Retrieved ${users.length} users`);
		return users;
	}

	@Get('profile')
	@ApiOperation({ summary: 'Get user profile' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'The user profile has been successfully retrieved.', type: User })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	public async getProfile(@Request() req: any): Promise<User> {
		this.logger.log(`Getting user profile for: ${req.user?.email}`);

		const user = await this.usersService.findOneByEmailWithRoles(req.user.email);
		const userResponse = { ...user.toObject() };
		delete userResponse.password;

		this.logger.log(`Profile retrieved for user: ${user._id}`);
		return userResponse as User;
	}

	@Get(':id')
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:read')
	@ApiOperation({ summary: 'Get user by ID' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'User retrieved successfully.', type: User })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	public async getUserById(@Param('id', ParseMongoIdPipe) id: string): Promise<User> {
		this.logger.log(`Getting user by id: ${id}`);
		const user = await this.usersService.findById(id);
		this.logger.log(`User retrieved successfully`);
		return user;
	}

	@Put('update')
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBody({ description: 'User update data', type: UpdateUserDto })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'The user profile has been successfully updated.', type: User })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	public async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<User> {
		this.logger.log(`Updating user profile for: ${req.user?.email}`);

		const user = await this.usersService.findOneAndUpdate({ email: req.user.email }, updateUserDto);
		this.logger.log(`User profile updated successfully`);
		return user;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:delete')
	@ApiOperation({ summary: 'Delete user by ID' })
	@ApiBearerAuth()
	@ApiResponse({ status: 204, description: 'The user has been successfully deleted.' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	public async deleteUserById(@Param('id', ParseMongoIdPipe) id: string): Promise<void> {
		this.logger.log(`Deleting user by id: ${id}`);

		await this.usersService.findOneAndDelete({ _id: id });
		this.logger.log(`User deleted successfully`);
	}

	@Post(':userId/roles/:roleId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Assign role to user' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Role assigned to user successfully.', type: User })
	@ApiResponse({ status: 404, description: 'User or role not found.' })
	public async assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<User> {
		this.logger.log(`Assigning role ${roleId} to user ${userId}`);

		const user = await this.usersService.assignRoleToUser(userId, roleId);
		this.logger.log(`Role assigned successfully`);
		return user;
	}

	@Delete(':userId/roles/:roleId')
	@UseGuards(PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Remove role from user' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Role removed from user successfully.', type: User })
	@ApiResponse({ status: 404, description: 'User or role not found.' })
	public async removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<User> {
		this.logger.log(`Removing role ${roleId} from user ${userId}`);

		const user = await this.usersService.removeRoleFromUser(userId, roleId);
		this.logger.log(`Role removed successfully`);
		return user;
	}
}
