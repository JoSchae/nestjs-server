import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role, RoleSchema } from './model/role.model';
import { CacheModule } from '../shared/cache/cache.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]), CacheModule],
	controllers: [RoleController],
	providers: [RoleService],
	exports: [RoleService],
})
export class RoleModule {}
