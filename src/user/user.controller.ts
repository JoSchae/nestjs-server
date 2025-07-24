import {
	ConflictException,
	Controller,
	Delete,
	Get,
	Logger,
	Post,
	Put,
	Request,
	Response,
	UseGuards,
	Param,
	Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/user/model/user.model';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequirePermissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
	logger: Logger = new Logger(UserController.name);
	constructor(private readonly usersService: UserService) {}

	@Post('create')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:create')
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
			const response = user.toObject();
			delete response.password;
			return res.status(201).json(response);
		} catch (error) {
			this.logger.error(`Error creating user ${JSON.stringify(error)}`);
			return res.status(409).json(error);
		}
	}

	@Get('all')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:read')
	@ApiOperation({ summary: 'Get all users' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	public async getAllUsers(@Response() res): Promise<any> {
		this.logger.log('Getting all users');
		try {
			const users = await this.usersService.findAll();
			return res.status(200).json(users);
		} catch (error) {
			this.logger.error(`Error getting all users ${error}`);
			res.status(500).json(error);
		}
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:read')
	@ApiOperation({ summary: 'Get user by ID' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'User retrieved successfully.' })
	@ApiResponse({ status: 404, description: 'User not found.' })
	public async getUserById(@Param('id') id: string, @Response() res): Promise<any> {
		this.logger.log(`Getting user by id: ${id}`);
		try {
			const user = await this.usersService.findById(id);
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error getting user by id ${error}`);
			res.status(404).json(error);
		}
	}

	@Get('profile')
	@UseGuards(JwtAuthGuard)
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
			const user = await this.usersService.findOneByEmailWithRoles(req.user.email);
			const userResponse = { ...user.toObject() };
			delete userResponse.password;
			return res.status(200).json(userResponse);
		} catch (error) {
			this.logger.error(`Error getting user profile ${error}`);
			res.status(500).json(error);
		}
	}

	@Put('update')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'The user profile has been successfully updated.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	public async updateProfile(@Request() req: any, @Response() res): Promise<any> {
		this.logger.log(`Updating user profile...}`);
		try {
			const authHeader = req.headers.authorization;
			const token = authHeader ? authHeader.split(' ')[1] : null;
			this.logger.log(`JWT Token: ${token}`);
			this.logger.log(`Updating user profile ${JSON.stringify(req.user)}`);
			const user = await this.usersService.findOneAndUpdate({ email: req.user.email }, req.body);
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error updating user profile ${error}`);
			res.status(500).json(error);
		}
	}

	@Delete('delete')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:delete')
	@ApiOperation({ summary: 'Delete user profile' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'The user profile has been successfully deleted.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 500, description: 'Internal server error.' })
	public async deleteProfile(@Request() req: any, @Response() res): Promise<any> {
		this.logger.log(`Deleting user profile...}`);
		try {
			const authHeader = req.headers.authorization;
			const token = authHeader ? authHeader.split(' ')[1] : null;
			this.logger.log(`JWT Token: ${token}`);
			this.logger.log(`Deleting user profile ${JSON.stringify(req.user)}`);
			const user = await this.usersService.findOneAndDelete({ email: req.user.email });
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error deleting user profile ${error}`);
			res.status(500).json(error);
		}
	}

	@Post(':userId/roles/:roleId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Assign role to user' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Role assigned to user successfully.' })
	@ApiResponse({ status: 404, description: 'User or role not found.' })
	public async assignRole(
		@Param('userId') userId: string,
		@Param('roleId') roleId: string,
		@Response() res,
	): Promise<any> {
		this.logger.log(`Assigning role ${roleId} to user ${userId}`);
		try {
			const user = await this.usersService.assignRoleToUser(userId, roleId);
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error assigning role to user ${error}`);
			res.status(404).json(error);
		}
	}

	@Delete(':userId/roles/:roleId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions('user:update')
	@ApiOperation({ summary: 'Remove role from user' })
	@ApiBearerAuth()
	@ApiResponse({ status: 200, description: 'Role removed from user successfully.' })
	@ApiResponse({ status: 404, description: 'User or role not found.' })
	public async removeRole(
		@Param('userId') userId: string,
		@Param('roleId') roleId: string,
		@Response() res,
	): Promise<any> {
		this.logger.log(`Removing role ${roleId} from user ${userId}`);
		try {
			const user = await this.usersService.removeRoleFromUser(userId, roleId);
			return res.status(200).json(user);
		} catch (error) {
			this.logger.error(`Error removing role from user ${error}`);
			res.status(404).json(error);
		}
	}
}
