import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument, PermissionAction, PermissionResource } from './model/permission.model';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';
import { CacheService } from '../shared/cache/cache.service';
import { CacheInvalidationService } from '../shared/cache/cache-invalidation.service';
import { CacheKeyGenerator } from '../shared/cache/cache-key.generator';

@Injectable()
export class PermissionService {
	private readonly logger = new CustomLoggerService();

	constructor(
		@InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
		private readonly cacheService: CacheService,
		private readonly cacheInvalidation: CacheInvalidationService,
		private readonly configService: ConfigService,
	) {
		this.logger.setContext(PermissionService.name);
	}

	async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
		this.logger.log('Creating new permission', {
			permissionName: createPermissionDto.name,
			action: createPermissionDto.action,
			resource: createPermissionDto.resource,
			service: 'PermissionService',
			method: 'create',
		});

		// Input validation
		if (!createPermissionDto.name || createPermissionDto.name.trim() === '') {
			this.logger.warn('Permission creation failed: Empty name provided', {
				service: 'PermissionService',
				method: 'create',
			});
			throw new BadRequestException('Permission name is required');
		}

		if (!createPermissionDto.action) {
			this.logger.warn('Permission creation failed: No action provided', {
				permissionName: createPermissionDto.name,
				service: 'PermissionService',
				method: 'create',
			});
			throw new BadRequestException('Permission action is required');
		}

		if (!createPermissionDto.resource) {
			this.logger.warn('Permission creation failed: No resource provided', {
				permissionName: createPermissionDto.name,
				action: createPermissionDto.action,
				service: 'PermissionService',
				method: 'create',
			});
			throw new BadRequestException('Permission resource is required');
		}

		// Normalize permission name
		createPermissionDto.name = createPermissionDto.name.trim();

		try {
			const existingPermission = await this.permissionModel.findOne({ name: createPermissionDto.name });
			if (existingPermission) {
				this.logger.warn('Permission creation failed - name already exists', {
					permissionName: createPermissionDto.name,
					existingPermissionId: existingPermission._id,
					service: 'PermissionService',
					method: 'create',
				});
				throw new ConflictException(`Permission with name '${createPermissionDto.name}' already exists`);
			}

			// Check for duplicate action-resource combination
			const existingActionResource = await this.permissionModel.findOne({
				action: createPermissionDto.action,
				resource: createPermissionDto.resource,
			});
			if (existingActionResource) {
				this.logger.warn('Permission creation failed - action-resource combination already exists', {
					permissionName: createPermissionDto.name,
					action: createPermissionDto.action,
					resource: createPermissionDto.resource,
					existingPermissionId: existingActionResource._id,
					existingPermissionName: existingActionResource.name,
					service: 'PermissionService',
					method: 'create',
				});
				throw new ConflictException(
					`Permission with action '${createPermissionDto.action}' and resource '${createPermissionDto.resource}' already exists as '${existingActionResource.name}'`,
				);
			}

			const permission = new this.permissionModel(createPermissionDto);
			const savedPermission = await permission.save();

			// Invalidate cache
			await this.cacheService.del(CacheKeyGenerator.permission.all());

			this.logger.log('Permission created successfully', {
				permissionId: savedPermission._id,
				permissionName: savedPermission.name,
				action: savedPermission.action,
				resource: savedPermission.resource,
				service: 'PermissionService',
				method: 'create',
			});

			return savedPermission;
		} catch (error) {
			if (error instanceof ConflictException || error instanceof BadRequestException) {
				throw error;
			}
			this.logger.error('Failed to create permission', error, {
				permissionName: createPermissionDto.name,
				service: 'PermissionService',
				method: 'create',
			});
			throw error;
		}
	}

	async findAll(): Promise<Permission[]> {
		this.logger.log('Retrieving all active permissions', {
			service: 'PermissionService',
			method: 'findAll',
		});

		try {
			const cacheKey = CacheKeyGenerator.permission.all();
			const ttl = this.configService.get('cache.ttl.veryLong');

			return await this.cacheService.wrap(
				cacheKey,
				async () => {
					// Using lean() for better performance on read-only operations
					const permissions = await this.permissionModel.find({ isActive: true }).lean().exec();

					this.logger.log('All permissions retrieved from database', {
						totalPermissions: permissions.length,
						service: 'PermissionService',
						method: 'findAll',
					});

					return permissions;
				},
				ttl,
			);
		} catch (error) {
			this.logger.error('Failed to retrieve all permissions', error, {
				service: 'PermissionService',
				method: 'findAll',
			});
			throw error;
		}
	}

	async findOne(id: string): Promise<Permission> {
		this.logger.log('Finding permission by ID', {
			permissionId: id,
			service: 'PermissionService',
			method: 'findOne',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid permission ID provided', {
				permissionId: id,
				service: 'PermissionService',
				method: 'findOne',
			});
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		try {
			const cacheKey = CacheKeyGenerator.permission.byId(id);
			const ttl = this.configService.get('cache.ttl.veryLong');

			return await this.cacheService.wrap(
				cacheKey,
				async () => {
					const permission = await this.permissionModel.findById(id).exec();
					if (!permission) {
						this.logger.warn('Permission not found by ID', {
							permissionId: id,
							service: 'PermissionService',
							method: 'findOne',
						});
						throw new NotFoundException(`Permission with ID ${id} not found`);
					}

					this.logger.log('Permission found by ID from database', {
						permissionId: id,
						permissionName: permission.name,
						action: permission.action,
						resource: permission.resource,
						service: 'PermissionService',
						method: 'findOne',
					});

					return permission;
				},
				ttl,
			);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to find permission by ID', error, {
				permissionId: id,
				service: 'PermissionService',
				method: 'findOne',
			});
			throw error;
		}
	}

	async findByName(name: string): Promise<Permission> {
		this.logger.log('Finding permission by name', {
			permissionName: name,
			service: 'PermissionService',
			method: 'findByName',
		});

		try {
			const cacheKey = CacheKeyGenerator.permission.byName(name);
			const ttl = this.configService.get('cache.ttl.veryLong');

			return await this.cacheService.wrap(
				cacheKey,
				async () => {
					const permission = await this.permissionModel.findOne({ name, isActive: true }).exec();
					if (!permission) {
						this.logger.warn('Permission not found by name', {
							permissionName: name,
							service: 'PermissionService',
							method: 'findByName',
						});
						throw new NotFoundException(`Permission with name '${name}' not found`);
					}

					this.logger.log('Permission found by name from database', {
						permissionId: permission._id,
						permissionName: name,
						action: permission.action,
						resource: permission.resource,
						service: 'PermissionService',
						method: 'findByName',
					});

					return permission;
				},
				ttl,
			);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to find permission by name', error, {
				permissionName: name,
				service: 'PermissionService',
				method: 'findByName',
			});
			throw error;
		}
	}

	async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
		this.logger.log('Updating permission', {
			permissionId: id,
			updateFields: Object.keys(updatePermissionDto),
			service: 'PermissionService',
			method: 'update',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid permission ID provided for update', {
				permissionId: id,
				service: 'PermissionService',
				method: 'update',
			});
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		try {
			const permission = await this.permissionModel
				.findByIdAndUpdate(id, updatePermissionDto, { new: true, runValidators: true })
				.exec();

			if (!permission) {
				this.logger.warn('Permission not found for update', {
					permissionId: id,
					service: 'PermissionService',
					method: 'update',
				});
				throw new NotFoundException(`Permission with ID ${id} not found`);
			}

			// Invalidate cache
			await this.cacheInvalidation.invalidatePermission(id, permission.name);

			this.logger.log('Permission updated successfully', {
				permissionId: id,
				permissionName: permission.name,
				action: permission.action,
				resource: permission.resource,
				service: 'PermissionService',
				method: 'update',
			});

			return permission;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to update permission', error, {
				permissionId: id,
				service: 'PermissionService',
				method: 'update',
			});
			throw error;
		}
	}

	async remove(id: string): Promise<Permission> {
		this.logger.log('Deleting permission', {
			permissionId: id,
			service: 'PermissionService',
			method: 'remove',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid permission ID provided for deletion', {
				permissionId: id,
				service: 'PermissionService',
				method: 'remove',
			});
			throw new NotFoundException(`Invalid permission ID: ${id}`);
		}

		try {
			const permission = await this.permissionModel.findByIdAndDelete(id).exec();

			if (!permission) {
				this.logger.warn('Permission not found for deletion', {
					permissionId: id,
					service: 'PermissionService',
					method: 'remove',
				});
				throw new NotFoundException(`Permission with ID ${id} not found`);
			}

			// Invalidate cache
			await this.cacheInvalidation.invalidatePermission(id, permission.name);

			this.logger.log('Permission deleted successfully', {
				permissionId: id,
				permissionName: permission.name,
				service: 'PermissionService',
				method: 'remove',
			});

			return permission;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to delete permission', error, {
				permissionId: id,
				service: 'PermissionService',
				method: 'remove',
			});
			throw error;
		}
	}

	async findByActionAndResource(action: PermissionAction, resource: PermissionResource): Promise<Permission[]> {
		this.logger.log('Finding permissions by action and resource', {
			action,
			resource,
			service: 'PermissionService',
			method: 'findByActionAndResource',
		});

		try {
			const permissions = await this.permissionModel
				.find({
					action,
					resource,
					isActive: true,
				})
				.exec();

			this.logger.log('Permissions found by action and resource successfully', {
				action,
				resource,
				count: permissions.length,
				service: 'PermissionService',
				method: 'findByActionAndResource',
			});

			return permissions;
		} catch (error) {
			this.logger.error('Failed to find permissions by action and resource', error, {
				action,
				resource,
				service: 'PermissionService',
				method: 'findByActionAndResource',
			});
			throw error;
		}
	}

	async seedDefaultPermissions(): Promise<void> {
		this.logger.log('Starting default permissions seeding process', {
			service: 'PermissionService',
			method: 'seedDefaultPermissions',
		});

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

			// Metrics permissions
			{
				name: 'metrics:read',
				description: 'Read system metrics',
				action: PermissionAction.READ,
				resource: PermissionResource.METRICS,
			},
			{
				name: 'metrics:manage',
				description: 'Full metrics access',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.METRICS,
			},

			// Super admin permission
			{
				name: 'all:manage',
				description: 'Full system access',
				action: PermissionAction.MANAGE,
				resource: PermissionResource.ALL,
			},
		];

		let createdCount = 0;
		let existingCount = 0;

		try {
			for (const permissionData of defaultPermissions) {
				const existingPermission = await this.permissionModel.findOne({ name: permissionData.name });
				if (!existingPermission) {
					await this.create(permissionData);
					createdCount++;
					this.logger.log('Default permission created', {
						permissionName: permissionData.name,
						action: permissionData.action,
						resource: permissionData.resource,
						service: 'PermissionService',
						method: 'seedDefaultPermissions',
					});
				} else {
					existingCount++;
				}
			}

			this.logger.log('Default permissions seeding completed successfully', {
				totalPermissions: defaultPermissions.length,
				created: createdCount,
				alreadyExisting: existingCount,
				service: 'PermissionService',
				method: 'seedDefaultPermissions',
			});
		} catch (error) {
			this.logger.error('Failed to seed default permissions', error, {
				totalPermissions: defaultPermissions.length,
				created: createdCount,
				service: 'PermissionService',
				method: 'seedDefaultPermissions',
			});
			throw error;
		}
	}
}
