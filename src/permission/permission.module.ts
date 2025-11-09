import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { Permission, PermissionSchema } from './model/permission.model';
import { CacheModule } from '../shared/cache/cache.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: Permission.name, schema: PermissionSchema }]), CacheModule],
	controllers: [PermissionController],
	providers: [PermissionService],
	exports: [PermissionService],
})
export class PermissionModule {}
