import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument, PermissionAction, PermissionResource } from './model/permission.model';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
	private readonly logger = new Logger(PermissionService.name);

	constructor(@InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>) {}

	async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
		this.logger.log(`Creating permission: ${createPermissionDto.name}`);

		const existingPermission = await this.permissionModel.findOne({ name: createPermissionDto.name });
		if (existingPermission) {
			throw new ConflictException(`Permission with name '${createPermissionDto.name}' already exists`);
		}

		const permission = new this.permissionModel(createPermissionDto);
		return permission.save();
	}

	async findAll(): Promise<Permission[]> {
		this.logger.log('Finding all permissions');
		return this.permissionModel.find({ isActive: true }).exec();
	}

	async findOne(id: string): Promise<Permission> {
		this.logger.log(`Finding permission by id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		const permission = await this.permissionModel.findById(id).exec();
		if (!permission) {
			throw new NotFoundException(`Permission with ID ${id} not found`);
		}
		return permission;
	}

	async findByName(name: string): Promise<Permission> {
		this.logger.log(`Finding permission by name: ${name}`);
		const permission = await this.permissionModel.findOne({ name, isActive: true }).exec();
		if (!permission) {
			throw new NotFoundException(`Permission with name '${name}' not found`);
		}
		return permission;
	}

	async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
		this.logger.log(`Updating permission with id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		const permission = await this.permissionModel
			.findByIdAndUpdate(id, updatePermissionDto, { new: true, runValidators: true })
			.exec();

		if (!permission) {
			throw new NotFoundException(`Permission with ID ${id} not found`);
		}
		return permission;
	}

	async remove(id: string): Promise<Permission> {
		this.logger.log(`Soft deleting permission with id: ${id}`);

		if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		const permission = await this.permissionModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();

		if (!permission) {
			throw new NotFoundException(`Permission with ID ${id} not found`);
		}
		return permission;
	}

	async findByActionAndResource(action: PermissionAction, resource: PermissionResource): Promise<Permission[]> {
		this.logger.log(`Finding permissions by action: ${action} and resource: ${resource}`);
		return this.permissionModel
			.find({
				action,
				resource,
				isActive: true,
			})
			.exec();
	}

	async seedDefaultPermissions(): Promise<void> {
		this.logger.log('Seeding default permissions');

		const defaultPermissions = [
			// User permissions
			{
				name: 'user:create',
				description: 'Create users',
				action: PermissionAction.CREATE,
				resource: PermissionResource.USER,
			},
			{
				name: 'user:read',
				description: 'Read user information',
				action: PermissionAction.READ,
				resource: PermissionResource.USER,
			},
			{
				name: 'user:update',
				description: 'Update user information',
				action: PermissionAction.UPDATE,
				resource: PermissionResource.USER,
			},
			{
				name: 'user:delete',
				description: 'Delete users',
				action: PermissionAction.DELETE,
				resource: PermissionResource.USER,
			},
			{
				name: 'user:manage',
				description: 'Full user management',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.USER,
			},

			// Role permissions
			{
				name: 'role:create',
				description: 'Create roles',
				action: PermissionAction.CREATE,
				resource: PermissionResource.ROLE,
			},
			{
				name: 'role:read',
				description: 'Read role information',
				action: PermissionAction.READ,
				resource: PermissionResource.ROLE,
			},
			{
				name: 'role:update',
				description: 'Update role information',
				action: PermissionAction.UPDATE,
				resource: PermissionResource.ROLE,
			},
			{
				name: 'role:delete',
				description: 'Delete roles',
				action: PermissionAction.DELETE,
				resource: PermissionResource.ROLE,
			},
			{
				name: 'role:manage',
				description: 'Full role management',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.ROLE,
			},

			// Permission permissions
			{
				name: 'permission:create',
				description: 'Create permissions',
				action: PermissionAction.CREATE,
				resource: PermissionResource.PERMISSION,
			},
			{
				name: 'permission:read',
				description: 'Read permission information',
				action: PermissionAction.READ,
				resource: PermissionResource.PERMISSION,
			},
			{
				name: 'permission:update',
				description: 'Update permission information',
				action: PermissionAction.UPDATE,
				resource: PermissionResource.PERMISSION,
			},
			{
				name: 'permission:delete',
				description: 'Delete permissions',
				action: PermissionAction.DELETE,
				resource: PermissionResource.PERMISSION,
			},
			{
				name: 'permission:manage',
				description: 'Full permission management',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.PERMISSION,
			},

			// Super admin permission
			{
				name: 'all:manage',
				description: 'Full system access',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.ALL,
			},
		];

		for (const permissionData of defaultPermissions) {
			const existingPermission = await this.permissionModel.findOne({ name: permissionData.name });
			if (!existingPermission) {
				await this.create(permissionData);
			}
		}
	}
}
