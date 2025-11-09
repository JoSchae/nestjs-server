import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './guards/jwtStrategy';
import { LocalStrategy } from './guards/localStrategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordModule } from 'src/shared/password/password.module';

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const secret = configService.get<string>('JWT_SECRET');
				if (!secret) {
					throw new Error('JWT_SECRET environment variable is required');
				}
				const expiresIn = configService.get<string>('JWT_EXPIRATION') || '3600s';
				return {
					secret,
					signOptions: {
						expiresIn: expiresIn as any,
					},
				};
			},
			inject: [ConfigService],
		}),
		UserModule,
		PassportModule,
		PasswordModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, LocalStrategy],
	exports: [AuthService, JwtModule],
})
export class AuthModule {}
