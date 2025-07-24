import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { Permission, PermissionSchema } from './model/permission.model';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Permission.name, schema: PermissionSchema }]),
		forwardRef(() => UserModule),
	],
	controllers: [PermissionController],
	providers: [PermissionService],
	exports: [PermissionService],
})
export class PermissionModule {}
