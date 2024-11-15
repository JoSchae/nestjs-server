import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwtStrategy';
import { LocalStrategy } from './localStrategy';

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: '3000s' },
		}),
		forwardRef(() => UsersModule),
		PassportModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, LocalStrategy],
	exports: [AuthService],
})
export class AuthModule {}
