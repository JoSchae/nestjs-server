import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { User, UserDocument } from 'src/user/model/user.model';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@Inject(forwardRef(() => AuthService)) private authService: AuthService,
	) {}

	public async findOneByEmail(query: any, withPassword = true): Promise<any> {
		this.logger.log(`Finding user ${JSON.stringify(query)}`);
		return await this.userModel.findOne(query).select(`${withPassword ? '+' : '-'}password`);
	}

	public async findOneByEmailWithRoles(email: string): Promise<any> {
		this.logger.log(`Finding user with roles: ${email}`);
		return await this.userModel
			.findOne({ email, isActive: true })
			.populate({
				path: 'roles',
				populate: {
					path: 'permissions',
					model: 'Permission',
				},
			})
			.exec();
	}

	public async create(user: any): Promise<any> {
		this.logger.log(`Creating user ${JSON.stringify(user)}`);
		user.password = await this.authService.getHashedPassword(user.password);
		const newUser = new this.userModel(user);
		return newUser.save();
	}

	public async findOneAndUpdate(query: any, payload: any): Promise<User> {
		this.logger.log(`Updating user ${JSON.stringify(query)}`);
		return this.userModel.findOneAndUpdate(query, payload, { new: true });
	}

	public async findOneAndDelete(query: any): Promise<User> {
		this.logger.log(`Deleting user ${JSON.stringify(query)}`);
		return this.userModel.findOneAndDelete(query);
	}

	public async assignRoleToUser(userId: string, roleId: string): Promise<User> {
		this.logger.log(`Assigning role ${roleId} to user ${userId}`);

		if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(roleId)) {
			throw new NotFoundException('Invalid user or role ID');
		}

		const user = await this.userModel
			.findByIdAndUpdate(userId, { $addToSet: { roles: roleId } }, { new: true })
			.populate('roles')
			.exec();

		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}
		return user;
	}

	public async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
		this.logger.log(`Removing role ${roleId} from user ${userId}`);

		if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(roleId)) {
			throw new NotFoundException('Invalid user or role ID');
		}

		const user = await this.userModel
			.findByIdAndUpdate(userId, { $pull: { roles: roleId } }, { new: true })
			.populate('roles')
			.exec();

		if (!user) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}
		return user;
	}

	public async findAll(): Promise<User[]> {
		this.logger.log('Finding all users');
		return this.userModel.find({ isActive: true }).populate('roles').exec();
	}

	public async findById(id: string): Promise<User> {
		this.logger.log(`Finding user by id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid user ID: ${id}`);
		}

		const user = await this.userModel.findById(id).populate('roles').exec();
		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}
		return user;
	}

	public async updateLastLogin(userId: string): Promise<void> {
		this.logger.log(`Updating last login for user: ${userId}`);
		await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
	}
}
