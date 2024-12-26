import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

	public async create(user: any): Promise<any> {
		this.logger.log(`Creating user ${JSON.stringify(user)}`);
		user.password = await this.authService.getHashedPassword(user.password);
		const newUser = new this.userModel(user);
		return newUser.save();
	}

	public async findOneAndUpdate(query: any, playload: any): Promise<User> {
		this.logger.log(`Updating user ${JSON.stringify(query)}`);
		return this.userModel.findOneAndUpdate(query, playload, { new: true });
	}

	public async findOneAndDelete(query: any): Promise<User> {
		this.logger.log(`Deleting user ${JSON.stringify(query)}`);
		return this.userModel.findOneAndDelete(query);
	}
}
