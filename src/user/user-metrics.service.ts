import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserDocument } from './model/user.model';
import { CustomMetricsService } from '../metrics/custom-metrics.service';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';

@Injectable()
export class UserMetricsService implements OnModuleInit {
	private readonly logger = new CustomLoggerService();

	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private readonly metricsService: CustomMetricsService,
	) {
		this.logger.setContext(UserMetricsService.name);
	}

	async onModuleInit() {
		this.logger.log('Initializing user metrics on startup', {
			service: 'UserMetricsService',
			method: 'onModuleInit',
		});

		// Update metrics immediately on startup
		await this.updateUserMetrics();
	}

	/**
	 * Update user metrics every 5 minutes
	 */
	@Cron(CronExpression.EVERY_5_MINUTES)
	async updateUserMetrics() {
		try {
			this.logger.debug('Updating user metrics', {
				service: 'UserMetricsService',
				method: 'updateUserMetrics',
			});

			// Count total users
			const totalUsers = await this.userModel.countDocuments();

			// Count active users (isActive: true)
			const activeUsers = await this.userModel.countDocuments({ isActive: true });

			// Update metrics
			this.metricsService.setTotalUsers(totalUsers);
			this.metricsService.setActiveUsers(activeUsers);

			this.logger.log('User metrics updated successfully', {
				totalUsers,
				activeUsers,
				service: 'UserMetricsService',
				method: 'updateUserMetrics',
			});
		} catch (error) {
			this.logger.error('Failed to update user metrics', error, {
				service: 'UserMetricsService',
				method: 'updateUserMetrics',
			});
		}
	}
}
