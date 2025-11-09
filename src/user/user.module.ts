import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/model/user.model';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserMetricsService } from './user-metrics.service';
import { CacheModule } from '../shared/cache/cache.module';
import { PasswordModule } from 'src/shared/password/password.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		CacheModule,
		PasswordModule,
		MetricsModule,
	],
	controllers: [UserController],
	providers: [UserService, UserMetricsService],
	exports: [UserService],
})
export class UserModule {}
