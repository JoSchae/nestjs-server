import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { User, UserDocument } from 'src/models/user.model';

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@Inject(forwardRef(() => AuthService)) private authService: AuthService,
	) {}

	async findOneByEmail(query: any): Promise<any> {
		return await this.userModel.findOne(query).select('+password');
	}

	async create(user: any): Promise<any> {
		this.logger.log(`Creating user ${user}`);
		const hashedPassword = await this.authService.getHashedPassword(user.password);
		user.password = hashedPassword;
		const newUser = new this.userModel(user);
		return newUser.save();
	}

	async findOneAndUpdate(query: any, playload: any): Promise<User> {
		this.logger.log(`Updating user ${query}`);
		return this.userModel.findOneAndUpdate(query, playload, { new: true });
	}

	async findOneAndDelete(query: any): Promise<User> {
		this.logger.log(`Deleting user ${query}`);
		return this.userModel.findOneAndDelete(query);
	}
}
