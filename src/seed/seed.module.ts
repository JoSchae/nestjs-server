import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { PermissionModule } from '../permission/permission.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [PermissionModule, RoleModule, UserModule],
	providers: [SeedService],
	exports: [SeedService],
})
export class SeedModule {}
