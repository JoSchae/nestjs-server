import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwtStrategy';
import { LocalStrategy } from './localStrategy';
import { UserModule } from 'src/user/user.module';
import { AdminStrategy } from './adminStrategy';

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: '1h' },
		}),
		forwardRef(() => UserModule),
		PassportModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, LocalStrategy, AdminStrategy],
	exports: [AuthService],
})
export class AuthModule {}
