import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role, RoleSchema } from './model/role.model';
import { UserModule } from '../user/user.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]), forwardRef(() => UserModule)],
	controllers: [RoleController],
	providers: [RoleService],
	exports: [RoleService],
})
export class RoleModule {}
