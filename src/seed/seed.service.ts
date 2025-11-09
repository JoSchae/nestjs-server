import { Injectable, OnModuleInit } from '@nestjs/common';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { PermissionAction, PermissionResource } from '../permission/model/permission.model';
import { CustomLoggerService } from '../shared/logger/custom-logger.service';

@Injectable()
export class SeedService implements OnModuleInit {
	private readonly logger = new CustomLoggerService();

	constructor(
		private readonly permissionService: PermissionService,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
	) {
		this.logger.setContext(SeedService.name);
	}

	async onModuleInit() {
		await this.seedDefaultData();
	}

	async seedDefaultData() {
		this.logger.log('Starting comprehensive data seeding process', {
			service: 'SeedService',
			method: 'seedDefaultData',
		});

		try {
			// Seed permissions first
			this.logger.log('Initiating permissions seeding', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'permissions',
			});
			await this.permissionService.seedDefaultPermissions();
			this.logger.log('Default permissions seeded successfully', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'permissions',
			});

			// Seed default roles
			this.logger.log('Initiating roles seeding', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'roles',
			});
			await this.seedDefaultRoles();
			this.logger.log('Default roles seeded successfully', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'roles',
			});

			// Create super admin user if it doesn't exist
			this.logger.log('Initiating super admin user creation', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'super_admin',
			});
			await this.createSuperAdminUser();
			this.logger.log('Super admin user checked/created successfully', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'super_admin',
			});

			// Create monitoring user if it doesn't exist
			this.logger.log('Initiating monitoring user creation', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'monitoring',
			});
			await this.createMonitoringUser();
			this.logger.log('Monitoring user checked/created successfully', {
				service: 'SeedService',
				method: 'seedDefaultData',
				step: 'monitoring',
			});

			this.logger.log('Data seeding process completed successfully', {
				service: 'SeedService',
				method: 'seedDefaultData',
				status: 'completed',
			});
		} catch (error) {
			this.logger.error('Error during comprehensive data seeding', error, {
				service: 'SeedService',
				method: 'seedDefaultData',
			});
			throw error;
		}
	}

	private async seedDefaultRoles() {
		this.logger.log('Starting default roles seeding', {
			service: 'SeedService',
			method: 'seedDefaultRoles',
		});

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
			{
				name: 'monitoring',
				description: 'Monitoring system access for metrics collection',
				permissions: ['metrics:read'],
			},
		];

		let createdCount = 0;
		let existingCount = 0;

		for (const roleData of roles) {
			try {
				this.logger.log('Processing role creation', {
					roleName: roleData.name,
					permissionCount: roleData.permissions.length,
					service: 'SeedService',
					method: 'seedDefaultRoles',
				});

				// Check if role exists
				const existingRole = await this.roleService.findByName(roleData.name).catch(() => null);

				const permissionIds = [];
				for (const permissionName of roleData.permissions) {
					try {
						const permission = await this.permissionService.findByName(permissionName);
						permissionIds.push((permission as any)._id);
					} catch (error) {
						this.logger.warn('Permission not found during role creation/update', {
							permissionName,
							roleName: roleData.name,
							service: 'SeedService',
							method: 'seedDefaultRoles',
						});
					}
				}

				if (!existingRole) {
					// Create role
					await this.roleService.create({
						name: roleData.name,
						description: roleData.description,
						permissions: permissionIds,
					});

					createdCount++;
					this.logger.log('Role created successfully', {
						roleName: roleData.name,
						permissionCount: permissionIds.length,
						service: 'SeedService',
						method: 'seedDefaultRoles',
					});
				} else {
					// Update existing role with current permissions
					await this.roleService.update((existingRole as any)._id, {
						description: roleData.description,
						permissions: permissionIds,
					});

					existingCount++;
					this.logger.log('Role already exists - updated permissions', {
						roleName: roleData.name,
						permissionCount: permissionIds.length,
						service: 'SeedService',
						method: 'seedDefaultRoles',
					});
				}
			} catch (error) {
				this.logger.error('Error creating role during seeding', error, {
					roleName: roleData.name,
					service: 'SeedService',
					method: 'seedDefaultRoles',
				});
			}
		}

		this.logger.log('Default roles seeding completed', {
			totalRoles: roles.length,
			created: createdCount,
			alreadyExisting: existingCount,
			service: 'SeedService',
			method: 'seedDefaultRoles',
		});
	}

	private async createSuperAdminUser() {
		const superAdminEmail = 'superadmin@system.com';

		this.logger.log('Processing super admin user creation', {
			email: superAdminEmail,
			service: 'SeedService',
			method: 'createSuperAdminUser',
		});

		try {
			// Check if super admin exists
			const existingUser = await this.userService.findOneByEmail({ email: superAdminEmail }).catch(() => null);

			if (!existingUser) {
				this.logger.log('Super admin not found, creating new user', {
					email: superAdminEmail,
					service: 'SeedService',
					method: 'createSuperAdminUser',
				});

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

				this.logger.log('Super admin user created successfully', {
					userId: (superAdminUser as any)._id,
					email: superAdminEmail,
					service: 'SeedService',
					method: 'createSuperAdminUser',
				});
				this.logger.warn('IMPORTANT: Please change the super admin password immediately!', {
					email: superAdminEmail,
					defaultPassword: 'SuperAdmin123!',
					service: 'SeedService',
					method: 'createSuperAdminUser',
				});
			} else {
				this.logger.log('Super admin user already exists', {
					email: superAdminEmail,
					service: 'SeedService',
					method: 'createSuperAdminUser',
				});
			}
		} catch (error) {
			this.logger.error('Error creating super admin user', error, {
				email: superAdminEmail,
				service: 'SeedService',
				method: 'createSuperAdminUser',
			});
			throw error;
		}
	}

	private async createMonitoringUser() {
		const monitoringEmail = 'monitoring@system.com';

		this.logger.log('Processing monitoring user creation', {
			email: monitoringEmail,
			service: 'SeedService',
			method: 'createMonitoringUser',
		});

		try {
			// Check if monitoring user exists
			const existingUser = await this.userService.findOneByEmail({ email: monitoringEmail }).catch(() => null);

			if (!existingUser) {
				this.logger.log('Monitoring user not found, creating new user', {
					email: monitoringEmail,
					service: 'SeedService',
					method: 'createMonitoringUser',
				});

				// Create monitoring user
				const monitoringUser = await this.userService.create({
					firstName: 'Monitoring',
					lastName: 'System',
					email: monitoringEmail,
					password: 'MonitoringSystem123!', // Should be changed for production
					isActive: true,
				});

				// Get monitoring role
				const monitoringRole = await this.roleService.findByName('monitoring');

				// Assign monitoring role
				await this.userService.assignRoleToUser((monitoringUser as any)._id, (monitoringRole as any)._id);

				this.logger.log('Monitoring user created successfully', {
					userId: (monitoringUser as any)._id,
					email: monitoringEmail,
					service: 'SeedService',
					method: 'createMonitoringUser',
				});
				this.logger.warn('IMPORTANT: Please change the monitoring user password for production!', {
					email: monitoringEmail,
					defaultPassword: 'MonitoringSystem123!',
					service: 'SeedService',
					method: 'createMonitoringUser',
				});
			} else {
				this.logger.log('Monitoring user already exists', {
					email: monitoringEmail,
					service: 'SeedService',
					method: 'createMonitoringUser',
				});
			}
		} catch (error) {
			this.logger.error('Error creating monitoring user', error, {
				email: monitoringEmail,
				service: 'SeedService',
				method: 'createMonitoringUser',
			});
			throw error;
		}
	}
}
