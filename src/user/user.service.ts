import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { User, UserDocument } from 'src/user/model/user.model';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';

@Injectable()
export class UserService {
	private readonly logger = new CustomLoggerService();
	
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@Inject(forwardRef(() => AuthService)) private authService: AuthService,
	) {
		this.logger.setContext(UserService.name);
	}

	public async findOneByEmail(query: any, withPassword = true): Promise<any> {
		this.logger.log('Searching for user by email', {
			hasPassword: withPassword,
			queryFields: Object.keys(query),
			service: 'UserService',
			method: 'findOneByEmail'
		});
		
		try {
			const user = await this.userModel.findOne(query).select(`${withPassword ? '+' : '-'}password`);
			
			this.logger.log('User search completed', {
				found: !!user,
				hasPassword: withPassword,
				service: 'UserService',
				method: 'findOneByEmail'
			});
			
			return user;
		} catch (error) {
			this.logger.error('Failed to find user by email', error, {
				queryFields: Object.keys(query),
				hasPassword: withPassword,
				service: 'UserService',
				method: 'findOneByEmail'
			});
			throw error;
		}
	}

	public async findOneByEmailWithRoles(email: string): Promise<any> {
		this.logger.log('Searching for user with roles', {
			email,
			service: 'UserService',
			method: 'findOneByEmailWithRoles'
		});
		
		try {
			const user = await this.userModel
				.findOne({ email, isActive: true })
				.populate({
					path: 'roles',
					model: 'Role',
					populate: {
						path: 'permissions',
						model: 'Permission',
					},
				})
				.exec();
			
			this.logger.log('User with roles search completed', {
				found: !!user,
				email,
				roleCount: user?.roles?.length || 0,
				service: 'UserService',
				method: 'findOneByEmailWithRoles'
			});
			
			return user;
		} catch (error) {
			this.logger.error('Failed to find user with roles', error, {
				email,
				service: 'UserService',
				method: 'findOneByEmailWithRoles'
			});
			throw error;
		}
	}

	public async create(user: any): Promise<any> {
		this.logger.log('Creating new user', {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			service: 'UserService',
			method: 'create'
		});
		
		try {
			user.password = await this.authService.getHashedPassword(user.password);
			const newUser = new this.userModel(user);
			const savedUser = await newUser.save();
			
			this.logger.log('User created successfully', {
				userId: savedUser._id,
				email: savedUser.email,
				service: 'UserService',
				method: 'create'
			});
			
			return savedUser;
		} catch (error) {
			this.logger.error('Failed to create user', error, {
				email: user.email,
				service: 'UserService',
				method: 'create'
			});
			throw error;
		}
	}

	public async findOneAndUpdate(query: any, payload: any): Promise<User> {
		this.logger.log('Updating user', {
			queryFields: Object.keys(query),
			updateFields: Object.keys(payload),
			service: 'UserService',
			method: 'findOneAndUpdate'
		});
		
		try {
			const updatedUser = await this.userModel.findOneAndUpdate(query, payload, { new: true });
			
			this.logger.log('User updated successfully', {
				found: !!updatedUser,
				userId: updatedUser?._id,
				service: 'UserService',
				method: 'findOneAndUpdate'
			});
			
			return updatedUser;
		} catch (error) {
			this.logger.error('Failed to update user', error, {
				queryFields: Object.keys(query),
				service: 'UserService',
				method: 'findOneAndUpdate'
			});
			throw error;
		}
	}

	public async findOneAndDelete(query: any): Promise<User> {
		this.logger.log('Deleting user', {
			queryFields: Object.keys(query),
			service: 'UserService',
			method: 'findOneAndDelete'
		});
		
		try {
			const deletedUser = await this.userModel.findOneAndDelete(query);
			
			this.logger.log('User deleted successfully', {
				found: !!deletedUser,
				userId: deletedUser?._id,
				service: 'UserService',
				method: 'findOneAndDelete'
			});
			
			return deletedUser;
		} catch (error) {
			this.logger.error('Failed to delete user', error, {
				queryFields: Object.keys(query),
				service: 'UserService',
				method: 'findOneAndDelete'
			});
			throw error;
		}
	}

	public async assignRoleToUser(userId: string, roleId: string): Promise<User> {
		this.logger.log('Assigning role to user', {
			userId,
			roleId,
			service: 'UserService',
			method: 'assignRoleToUser'
		});

		if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(roleId)) {
			this.logger.warn('Invalid user or role ID provided', {
				userId,
				roleId,
				userIdValid: Types.ObjectId.isValid(userId),
				roleIdValid: Types.ObjectId.isValid(roleId),
				service: 'UserService',
				method: 'assignRoleToUser'
			});
			throw new NotFoundException('Invalid user or role ID');
		}

		try {
			const user = await this.userModel
				.findByIdAndUpdate(userId, { $addToSet: { roles: roleId } }, { new: true })
				.populate('roles')
				.exec();

			if (!user) {
				this.logger.warn('User not found for role assignment', {
					userId,
					roleId,
					service: 'UserService',
					method: 'assignRoleToUser'
				});
				throw new NotFoundException(`User with ID ${userId} not found`);
			}
			
			this.logger.log('Role assigned to user successfully', {
				userId,
				roleId,
				totalRoles: user.roles?.length || 0,
				service: 'UserService',
				method: 'assignRoleToUser'
			});
			
			return user;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to assign role to user', error, {
				userId,
				roleId,
				service: 'UserService',
				method: 'assignRoleToUser'
			});
			throw error;
		}
	}

	public async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
		this.logger.log('Removing role from user', {
			userId,
			roleId,
			service: 'UserService',
			method: 'removeRoleFromUser'
		});

		if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(roleId)) {
			this.logger.warn('Invalid user or role ID provided', {
				userId,
				roleId,
				userIdValid: Types.ObjectId.isValid(userId),
				roleIdValid: Types.ObjectId.isValid(roleId),
				service: 'UserService',
				method: 'removeRoleFromUser'
			});
			throw new NotFoundException('Invalid user or role ID');
		}

		try {
			const user = await this.userModel
				.findByIdAndUpdate(userId, { $pull: { roles: roleId } }, { new: true })
				.populate('roles')
				.exec();

			if (!user) {
				this.logger.warn('User not found for role removal', {
					userId,
					roleId,
					service: 'UserService',
					method: 'removeRoleFromUser'
				});
				throw new NotFoundException(`User with ID ${userId} not found`);
			}
			
			this.logger.log('Role removed from user successfully', {
				userId,
				roleId,
				remainingRoles: user.roles?.length || 0,
				service: 'UserService',
				method: 'removeRoleFromUser'
			});
			
			return user;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to remove role from user', error, {
				userId,
				roleId,
				service: 'UserService',
				method: 'removeRoleFromUser'
			});
			throw error;
		}
	}

	public async findAll(): Promise<User[]> {
		this.logger.log('Retrieving all active users', {
			service: 'UserService',
			method: 'findAll'
		});
		
		try {
			const users = await this.userModel.find({ isActive: true }).populate('roles').exec();
			
			this.logger.log('All users retrieved successfully', {
				totalUsers: users.length,
				service: 'UserService',
				method: 'findAll'
			});
			
			return users;
		} catch (error) {
			this.logger.error('Failed to retrieve all users', error, {
				service: 'UserService',
				method: 'findAll'
			});
			throw error;
		}
	}

	public async findById(id: string): Promise<User> {
		this.logger.log('Finding user by ID', {
			userId: id,
			service: 'UserService',
			method: 'findById'
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid user ID provided', {
				userId: id,
				service: 'UserService',
				method: 'findById'
			});
			throw new NotFoundException(`Invalid user ID: ${id}`);
		}

		try {
			const user = await this.userModel.findById(id).populate('roles').exec();
			
			if (!user) {
				this.logger.warn('User not found by ID', {
					userId: id,
					service: 'UserService',
					method: 'findById'
				});
				throw new NotFoundException(`User with ID ${id} not found`);
			}
			
			this.logger.log('User found by ID successfully', {
				userId: id,
				email: user.email,
				roleCount: user.roles?.length || 0,
				service: 'UserService',
				method: 'findById'
			});
			
			return user;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to find user by ID', error, {
				userId: id,
				service: 'UserService',
				method: 'findById'
			});
			throw error;
		}
	}

	public async updateLastLogin(userId: string): Promise<void> {
		this.logger.log('Updating last login timestamp', {
			userId,
			service: 'UserService',
			method: 'updateLastLogin'
		});
		
		try {
			await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
			
			this.logger.log('Last login updated successfully', {
				userId,
				timestamp: new Date().toISOString(),
				service: 'UserService',
				method: 'updateLastLogin'
			});
		} catch (error) {
			this.logger.error('Failed to update last login', error, {
				userId,
				service: 'UserService',
				method: 'updateLastLogin'
			});
			throw error;
		}
	}
}
