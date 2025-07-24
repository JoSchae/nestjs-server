import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './guards/jwtStrategy';
import { LocalStrategy } from './guards/localStrategy';
import { AdminStrategy } from './guards/adminStrategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConstants } from './guards/constants';

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || jwtConstants.secret,
				signOptions: {
					expiresIn: configService.get<string>('JWT_EXPIRATION') || '3600s',
				},
			}),
			inject: [ConfigService],
		}),
		forwardRef(() => UserModule),
		PassportModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, LocalStrategy, AdminStrategy],
	exports: [AuthService, JwtModule],
})
export class AuthModule {}
