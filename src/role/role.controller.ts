import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Post()
	@RequirePermissions('role:create')
	@ApiOperation({ summary: 'Create a new role' })
	@ApiResponse({ status: 201, description: 'Role created successfully' })
	@ApiResponse({ status: 409, description: 'Role already exists' })
	create(@Body() createRoleDto: CreateRoleDto) {
		return this.roleService.create(createRoleDto);
	}

	@Get()
	@RequirePermissions('role:read')
	@ApiOperation({ summary: 'Get all roles' })
	@ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
	findAll() {
		return this.roleService.findAll();
	}

	@Get(':id')
	@RequirePermissions('role:read')
	@ApiOperation({ summary: 'Get role by ID' })
	@ApiResponse({ status: 200, description: 'Role retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	findOne(@Param('id') id: string) {
		return this.roleService.findOne(id);
	}

	@Patch(':id')
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Update role by ID' })
	@ApiResponse({ status: 200, description: 'Role updated successfully' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
		return this.roleService.update(id, updateRoleDto);
	}

	@Delete(':id')
	@RequirePermissions('role:delete')
	@ApiOperation({ summary: 'Delete role by ID' })
	@ApiResponse({ status: 200, description: 'Role deleted successfully' })
	@ApiResponse({ status: 404, description: 'Role not found' })
	remove(@Param('id') id: string) {
		return this.roleService.remove(id);
	}

	@Post(':roleId/permissions/:permissionId')
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Add permission to role' })
	@ApiResponse({ status: 200, description: 'Permission added to role successfully' })
	@ApiResponse({ status: 404, description: 'Role or permission not found' })
	addPermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
		return this.roleService.addPermissionToRole(roleId, permissionId);
	}

	@Delete(':roleId/permissions/:permissionId')
	@RequirePermissions('role:update')
	@ApiOperation({ summary: 'Remove permission from role' })
	@ApiResponse({ status: 200, description: 'Permission removed from role successfully' })
	@ApiResponse({ status: 404, description: 'Role or permission not found' })
	removePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
		return this.roleService.removePermissionFromRole(roleId, permissionId);
	}
}
