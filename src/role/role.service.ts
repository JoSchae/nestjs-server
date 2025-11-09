import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './model/role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';
import { CacheService } from '../shared/cache/cache.service';
import { CacheInvalidationService } from '../shared/cache/cache-invalidation.service';
import { CacheKeyGenerator } from '../shared/cache/cache-key.generator';

@Injectable()
export class RoleService {
	private readonly logger = new CustomLoggerService();

	constructor(
		@InjectModel(Role.name) private roleModel: Model<RoleDocument>,
		private readonly cacheService: CacheService,
		private readonly cacheInvalidation: CacheInvalidationService,
		private readonly configService: ConfigService,
	) {
		this.logger.setContext(RoleService.name);
	}

	async create(createRoleDto: CreateRoleDto): Promise<Role> {
		this.logger.log('Creating new role', {
			roleName: createRoleDto.name,
			description: createRoleDto.description,
			permissionCount: createRoleDto.permissions?.length || 0,
			service: 'RoleService',
			method: 'create',
		});

		// Input validation
		if (!createRoleDto.name || createRoleDto.name.trim() === '') {
			this.logger.warn('Role creation failed: Empty name provided', {
				service: 'RoleService',
				method: 'create',
			});
			throw new BadRequestException('Role name is required');
		}

		// Normalize role name (trim and ensure consistent case)
		createRoleDto.name = createRoleDto.name.trim();

		try {
			const existingRole = await this.roleModel.findOne({ name: createRoleDto.name });
			if (existingRole) {
				this.logger.warn('Role creation failed - name already exists', {
					roleName: createRoleDto.name,
					existingRoleId: existingRole._id,
					service: 'RoleService',
					method: 'create',
				});
				throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
			}

			const role = new this.roleModel(createRoleDto);
			const savedRole = await role.save();

			// Invalidate role list cache
			await this.cacheService.del(CacheKeyGenerator.role.all());

			this.logger.log('Role created successfully', {
				roleId: savedRole._id,
				roleName: savedRole.name,
				permissionCount: savedRole.permissions?.length || 0,
				service: 'RoleService',
				method: 'create',
			});

			return savedRole;
		} catch (error) {
			if (error instanceof ConflictException || error instanceof BadRequestException) {
				throw error;
			}
			this.logger.error('Failed to create role', error, {
				roleName: createRoleDto.name,
				service: 'RoleService',
				method: 'create',
			});
			throw error;
		}
	}

	async findAll(): Promise<Role[]> {
		this.logger.log('Retrieving all active roles', {
			service: 'RoleService',
			method: 'findAll',
		});

		try {
			const ttl = this.configService.get<number>('cache.ttl.long');
			const roles = await this.cacheService.wrap<Role[]>(
				CacheKeyGenerator.role.all(),
				async () => {
					// Using lean() for better performance on read-only operations
					const results = await this.roleModel.find({ isActive: true }).populate('permissions').lean().exec();
					return results;
				},
				ttl,
			);

			this.logger.log('All roles retrieved successfully', {
				totalRoles: roles.length,
				service: 'RoleService',
				method: 'findAll',
			});

			return roles;
		} catch (error) {
			this.logger.error('Failed to retrieve all roles', error, {
				service: 'RoleService',
				method: 'findAll',
			});
			throw error;
		}
	}

	async findOne(id: string): Promise<Role> {
		this.logger.log('Finding role by ID', {
			roleId: id,
			service: 'RoleService',
			method: 'findOne',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid role ID provided', {
				roleId: id,
				service: 'RoleService',
				method: 'findOne',
			});
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		try {
			const ttl = this.configService.get<number>('cache.ttl.long');
			const role = await this.cacheService.wrap<Role>(
				CacheKeyGenerator.role.byId(id),
				async () => {
					const result = await this.roleModel.findById(id).populate('permissions').exec();
					if (!result) {
						throw new NotFoundException(`Role with ID ${id} not found`);
					}
					return result;
				},
				ttl,
			);

			this.logger.log('Role found by ID successfully', {
				roleId: id,
				roleName: role.name,
				permissionCount: role.permissions?.length || 0,
				service: 'RoleService',
				method: 'findOne',
			});

			return role;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to find role by ID', error, {
				roleId: id,
				service: 'RoleService',
				method: 'findOne',
			});
			throw error;
		}
	}

	async findByName(name: string): Promise<Role> {
		this.logger.log('Finding role by name', {
			roleName: name,
			service: 'RoleService',
			method: 'findByName',
		});

		try {
			const ttl = this.configService.get<number>('cache.ttl.long');
			const role = await this.cacheService.wrap<Role>(
				CacheKeyGenerator.role.byName(name),
				async () => {
					const result = await this.roleModel
						.findOne({ name, isActive: true })
						.populate('permissions')
						.exec();
					if (!result) {
						throw new NotFoundException(`Role with name '${name}' not found`);
					}
					return result;
				},
				ttl,
			);

			this.logger.log('Role found by name successfully', {
				roleName: name,
				permissionCount: role.permissions?.length || 0,
				service: 'RoleService',
				method: 'findByName',
			});

			return role;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to find role by name', error, {
				roleName: name,
				service: 'RoleService',
				method: 'findByName',
			});
			throw error;
		}
	}

	async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
		this.logger.log('Updating role', {
			roleId: id,
			updateFields: Object.keys(updateRoleDto),
			service: 'RoleService',
			method: 'update',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid role ID provided for update', {
				roleId: id,
				service: 'RoleService',
				method: 'update',
			});
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		try {
			const role = await this.roleModel
				.findByIdAndUpdate(id, updateRoleDto, { new: true, runValidators: true })
				.populate('permissions')
				.exec();

			if (!role) {
				this.logger.warn('Role not found for update', {
					roleId: id,
					service: 'RoleService',
					method: 'update',
				});
				throw new NotFoundException(`Role with ID ${id} not found`);
			}

			// Invalidate role caches
			await this.cacheInvalidation.invalidateRole(id, role.name);

			this.logger.log('Role updated successfully', {
				roleId: id,
				roleName: role.name,
				permissionCount: role.permissions?.length || 0,
				service: 'RoleService',
				method: 'update',
			});

			return role;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to update role', error, {
				roleId: id,
				service: 'RoleService',
				method: 'update',
			});
			throw error;
		}
	}

	async remove(id: string): Promise<Role> {
		this.logger.log('Deleting role', {
			roleId: id,
			service: 'RoleService',
			method: 'remove',
		});

		if (!Types.ObjectId.isValid(id)) {
			this.logger.warn('Invalid role ID provided for deletion', {
				roleId: id,
				service: 'RoleService',
				method: 'remove',
			});
			throw new NotFoundException(`Invalid role ID: ${id}`);
		}

		try {
			const role = await this.roleModel.findByIdAndDelete(id).exec();

			if (!role) {
				this.logger.warn('Role not found for deletion', {
					roleId: id,
					service: 'RoleService',
					method: 'remove',
				});
				throw new NotFoundException(`Role with ID ${id} not found`);
			}

			// Invalidate role caches
			await this.cacheInvalidation.invalidateRole(id, role.name);

			this.logger.log('Role deleted successfully', {
				roleId: id,
				roleName: role.name,
				service: 'RoleService',
				method: 'remove',
			});

			return role;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to delete role', error, {
				roleId: id,
				service: 'RoleService',
				method: 'remove',
			});
			throw error;
		}
	}

	async addPermissionToRole(roleId: string, permissionId: string): Promise<Role> {
		this.logger.log('Adding permission to role', {
			roleId,
			permissionId,
			service: 'RoleService',
			method: 'addPermissionToRole',
		});

		if (!Types.ObjectId.isValid(roleId) || !Types.ObjectId.isValid(permissionId)) {
			this.logger.warn('Invalid role or permission ID provided', {
				roleId,
				permissionId,
				roleIdValid: Types.ObjectId.isValid(roleId),
				permissionIdValid: Types.ObjectId.isValid(permissionId),
				service: 'RoleService',
				method: 'addPermissionToRole',
			});
			throw new BadRequestException('Invalid role or permission ID');
		}

		try {
			// Check if role exists first
			const existingRole = await this.roleModel.findById(roleId);
			if (!existingRole) {
				this.logger.warn('Role not found for permission assignment', {
					roleId,
					permissionId,
					service: 'RoleService',
					method: 'addPermissionToRole',
				});
				throw new NotFoundException(`Role with ID ${roleId} not found`);
			}

			// Check if permission is already assigned
			if (existingRole.permissions && existingRole.permissions.some((p) => p.toString() === permissionId)) {
				this.logger.warn('Permission already assigned to role', {
					roleId,
					permissionId,
					roleName: existingRole.name,
					service: 'RoleService',
					method: 'addPermissionToRole',
				});
				throw new ConflictException(`Permission is already assigned to role '${existingRole.name}'`);
			}

			const role = await this.roleModel
				.findByIdAndUpdate(roleId, { $addToSet: { permissions: permissionId } }, { new: true })
				.populate('permissions')
				.exec();

			// Invalidate role caches
			await this.cacheInvalidation.invalidateRole(roleId, role.name);

			this.logger.log('Permission added to role successfully', {
				roleId,
				permissionId,
				roleName: role.name,
				totalPermissions: role.permissions?.length || 0,
				service: 'RoleService',
				method: 'addPermissionToRole',
			});

			return role;
		} catch (error) {
			if (
				error instanceof NotFoundException ||
				error instanceof BadRequestException ||
				error instanceof ConflictException
			) {
				throw error;
			}
			this.logger.error('Failed to add permission to role', error, {
				roleId,
				permissionId,
				service: 'RoleService',
				method: 'addPermissionToRole',
			});
			throw error;
		}
	}

	async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role> {
		this.logger.log('Removing permission from role', {
			roleId,
			permissionId,
			service: 'RoleService',
			method: 'removePermissionFromRole',
		});

		if (!Types.ObjectId.isValid(roleId) || !Types.ObjectId.isValid(permissionId)) {
			this.logger.warn('Invalid role or permission ID provided', {
				roleId,
				permissionId,
				roleIdValid: Types.ObjectId.isValid(roleId),
				permissionIdValid: Types.ObjectId.isValid(permissionId),
				service: 'RoleService',
				method: 'removePermissionFromRole',
			});
			throw new NotFoundException('Invalid role or permission ID');
		}

		try {
			const role = await this.roleModel
				.findByIdAndUpdate(roleId, { $pull: { permissions: permissionId } }, { new: true })
				.populate('permissions')
				.exec();

			if (!role) {
				this.logger.warn('Role not found for permission removal', {
					roleId,
					permissionId,
					service: 'RoleService',
					method: 'removePermissionFromRole',
				});
				throw new NotFoundException(`Role with ID ${roleId} not found`);
			}

			// Invalidate role caches
			await this.cacheInvalidation.invalidateRole(roleId, role.name);

			this.logger.log('Permission removed from role successfully', {
				roleId,
				permissionId,
				roleName: role.name,
				remainingPermissions: role.permissions?.length || 0,
				service: 'RoleService',
				method: 'removePermissionFromRole',
			});

			return role;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error('Failed to remove permission from role', error, {
				roleId,
				permissionId,
				service: 'RoleService',
				method: 'removePermissionFromRole',
			});
			throw error;
		}
	}
}
