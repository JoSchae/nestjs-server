import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './guards/constants';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './guards/jwtStrategy';
import { LocalStrategy } from './guards/localStrategy';
import { AdminStrategy } from './guards/adminStrategy';

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: '3000s' },
		}),
		forwardRef(() => UserModule),
		PassportModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, LocalStrategy, AdminStrategy],
	exports: [AuthService],
})
export class AuthModule {}
