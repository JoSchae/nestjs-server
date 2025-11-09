import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Role } from './model/role.model';
import { ParseMongoIdPipe } from '../shared/pipes/parse-mongo-id.pipe';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(PermissionsGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Post()
	@RequirePermissions('role:create')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new role' })
	@ApiResponse({ status: 201, description: 'Role created successfully' })
	@ApiResponse({ status: 409, description: 'Role already exists' })
	create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
		return this.roleService.create(createRoleDto);
	}

	@Get()
	@RequirePermissions('role:read')
	@ApiOperation({ summary: 'Get all roles' })
	@ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
	findAll(): Promise<Role[]> {
		return this.roleService.findAll();
	}

	@Get(':id')
	@RequirePermissions('role:read')
	@ApiOperation({ summary: 'Get role by ID' })
	@ApiResponse({ status: 200, description: 'Role retrieved successfully' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	findOne(@Param('id', ParseMongoIdPipe) id: string): Promise<Role> {
		return this.roleService.findOne(id);
	}

	@Patch(':id')
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Update role by ID' })
	@ApiResponse({ status: 200, description: 'Role updated successfully' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	update(@Param('id', ParseMongoIdPipe) id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<Role> {
		return this.roleService.update(id, updateRoleDto);
	}

	@Delete(':id')
	@RequirePermissions('role:delete')
	@ApiOperation({ summary: 'Delete role by ID' })
	@ApiResponse({ status: 200, description: 'Role deleted successfully' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	remove(@Param('id', ParseMongoIdPipe) id: string): Promise<Role> {
		return this.roleService.remove(id);
	}

	@Post(':roleId/permissions/:permissionId')
	@HttpCode(HttpStatus.OK)
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Add permission to role' })
	@ApiResponse({ status: 200, description: 'Permission added to role successfully' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId' })
	@ApiResponse({ status: 404, description: 'Role or permission not found' })
	addPermission(
		@Param('roleId', ParseMongoIdPipe) roleId: string,
		@Param('permissionId', ParseMongoIdPipe) permissionId: string,
	): Promise<Role> {
		return this.roleService.addPermissionToRole(roleId, permissionId);
	}

	@Delete(':roleId/permissions/:permissionId')
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Remove permission from role' })
	@ApiResponse({ status: 200, description: 'Permission removed from role successfully' })
	@ApiResponse({ status: 400, description: 'Invalid MongoDB ObjectId' })
	@ApiResponse({ status: 404, description: 'Role or permission not found' })
	removePermission(
		@Param('roleId', ParseMongoIdPipe) roleId: string,
		@Param('permissionId', ParseMongoIdPipe) permissionId: string,
	): Promise<Role> {
		return this.roleService.removePermissionFromRole(roleId, permissionId);
	}
}
