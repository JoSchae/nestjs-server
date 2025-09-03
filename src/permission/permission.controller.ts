import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(PermissionsGuard)
export class PermissionController {
	constructor(private readonly permissionService: PermissionService) {}

	@Post()
	@RequirePermissions('permission:create')
	@ApiOperation({ summary: 'Create a new permission' })
	@ApiResponse({ status: 201, description: 'Permission created successfully' })
	@ApiResponse({ status: 409, description: 'Permission already exists' })
	create(@Body() createPermissionDto: CreatePermissionDto) {
		return this.permissionService.create(createPermissionDto);
	}

	@Get()
	@RequirePermissions('permission:read')
	@ApiOperation({ summary: 'Get all permissions' })
	@ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
	findAll() {
		return this.permissionService.findAll();
	}

	@Get(':id')
	@RequirePermissions('permission:read')
	@ApiOperation({ summary: 'Get permission by ID' })
	@ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Permission not found' })
	findOne(@Param('id') id: string) {
		return this.permissionService.findOne(id);
	}

	@Patch(':id')
	@RequirePermissions('permission:update')
	@ApiOperation({ summary: 'Update permission by ID' })
	@ApiResponse({ status: 200, description: 'Permission updated successfully' })
	@ApiResponse({ status: 404, description: 'Permission not found' })
	update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
		return this.permissionService.update(id, updatePermissionDto);
	}

	@Delete(':id')
	@RequirePermissions('permission:delete')
	@ApiOperation({ summary: 'Delete permission by ID' })
	@ApiResponse({ status: 200, description: 'Permission deleted successfully' })
	@ApiResponse({ status: 404, description: 'Permission not found' })
	remove(@Param('id') id: string) {
		return this.permissionService.remove(id);
	}

	@Post('seed')
	@RequirePermissions('permission:create')
	@ApiOperation({ summary: 'Seed default permissions' })
	@ApiResponse({ status: 201, description: 'Default permissions seeded successfully' })
	seedDefaultPermissions() {
		return this.permissionService.seedDefaultPermissions();
	}
}
