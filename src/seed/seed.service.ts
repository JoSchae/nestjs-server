import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { PermissionAction, PermissionResource } from '../permission/model/permission.model';

@Injectable()
export class SeedService implements OnModuleInit {
	private readonly logger = new Logger(SeedService.name);

	constructor(
		private readonly permissionService: PermissionService,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
	) {}

	async onModuleInit() {
		await this.seedDefaultData();
	}

	async seedDefaultData() {
		this.logger.log('Starting default data seeding...');

		try {
			// Seed permissions first
			await this.permissionService.seedDefaultPermissions();
			this.logger.log('Default permissions seeded successfully');

			// Seed default roles
			await this.seedDefaultRoles();
			this.logger.log('Default roles seeded successfully');

			// Create super admin user if it doesn't exist
			await this.createSuperAdminUser();
			this.logger.log('Super admin user checked/created successfully');
		} catch (error) {
			this.logger.error('Error during seeding:', error);
		}
	}

	private async seedDefaultRoles() {
		const roles = [
			{
				name: 'super_admin',
				description: 'Super administrator with full system access',
				permissions: ['all:manage'],
			},
			{
				name: 'admin',
				description: 'Administrator with user and role management',
				permissions: ['user:manage', 'role:read', 'permission:read'],
			},
			{
				name: 'user_manager',
				description: 'Can manage users',
				permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
			},
			{
				name: 'user',
				description: 'Basic user with read-only access to own profile',
				permissions: ['user:read'],
			},
		];

		for (const roleData of roles) {
			try {
				// Check if role exists
				const existingRole = await this.roleService.findByName(roleData.name).catch(() => null);

				if (!existingRole) {
					// Get permission IDs
					const permissionIds = [];
					for (const permissionName of roleData.permissions) {
						try {
							const permission = await this.permissionService.findByName(permissionName);
							permissionIds.push((permission as any)._id);
						} catch (error) {
							this.logger.warn(`Permission not found: ${permissionName}`);
						}
					}

					// Create role
					await this.roleService.create({
						name: roleData.name,
						description: roleData.description,
						permissions: permissionIds,
					});

					this.logger.log(`Created role: ${roleData.name}`);
				}
			} catch (error) {
				this.logger.error(`Error creating role ${roleData.name}:`, error);
			}
		}
	}

	private async createSuperAdminUser() {
		const superAdminEmail = 'superadmin@system.com';

		try {
			// Check if super admin exists
			const existingUser = await this.userService.findOneByEmail({ email: superAdminEmail }).catch(() => null);

			if (!existingUser) {
				// Create super admin user
				const superAdminUser = await this.userService.create({
					firstName: 'Super',
					lastName: 'Admin',
					email: superAdminEmail,
					password: 'SuperAdmin123!', // Should be changed immediately
					isActive: true,
				});

				// Get super admin role
				const superAdminRole = await this.roleService.findByName('super_admin');

				// Assign super admin role
				await this.userService.assignRoleToUser((superAdminUser as any)._id, (superAdminRole as any)._id);

				this.logger.log('Super admin user created with default credentials');
				this.logger.warn('IMPORTANT: Please change the super admin password immediately!');
				this.logger.log(`Super admin email: ${superAdminEmail}`);
				this.logger.log('Super admin password: SuperAdmin123!');
			}
		} catch (error) {
			this.logger.error('Error creating super admin user:', error);
		}
	}
}
