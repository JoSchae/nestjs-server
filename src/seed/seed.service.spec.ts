import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';

describe('SeedService', () => {
	let service: SeedService;
	let permissionService: PermissionService;
	let roleService: RoleService;
	let userService: UserService;

	const mockPermissionService = {
		seedDefaultPermissions: jest.fn(),
		findOneByName: jest.fn(),
	};

	const mockRoleService = {
		findByName: jest.fn(),
		create: jest.fn(),
		addPermissionToRole: jest.fn(),
	};

	const mockUserService = {
		findOneByEmail: jest.fn(),
		create: jest.fn(),
		assignRoleToUser: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SeedService,
				{
					provide: PermissionService,
					useValue: mockPermissionService,
				},
				{
					provide: RoleService,
					useValue: mockRoleService,
				},
				{
					provide: UserService,
					useValue: mockUserService,
				},
			],
		}).compile();

		service = module.get<SeedService>(SeedService);
		permissionService = module.get<PermissionService>(PermissionService);
		roleService = module.get<RoleService>(RoleService);
		userService = module.get<UserService>(UserService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('seedDefaultData', () => {
		it('should call all seeding methods successfully', async () => {
			const mockSuperAdminRole = { _id: 'superAdminRoleId', name: 'super_admin' };
			const mockMonitoringRole = { _id: 'monitoringRoleId', name: 'monitoring' };
			const mockSuperAdminUser = { _id: 'superAdminUserId', email: 'admin@system.local' };
			const mockMonitoringUser = { _id: 'monitoringUserId', email: 'monitoring@system.local' };
			const mockPermission = { _id: 'permissionId', name: 'all:manage' };

			// Mock permission seeding
			mockPermissionService.seedDefaultPermissions.mockResolvedValue(undefined);
			mockPermissionService.findOneByName.mockResolvedValue(mockPermission);

			// Mock role operations - findByName returns null initially (roles don't exist yet)
			// After roles are created, subsequent calls should return the created roles
			let rolesCreated = false;
			mockRoleService.findByName.mockImplementation(async (name) => {
				if (!rolesCreated) {
					return null; // First pass - roles don't exist yet
				}
				// After seedDefaultRoles completes, roles exist
				if (name === 'super_admin') return mockSuperAdminRole;
				if (name === 'monitoring') return mockMonitoringRole;
				return null;
			});
			mockRoleService.create.mockImplementation(async (roleData) => {
				// Mark that roles have been created
				rolesCreated = true;
				if (roleData.name === 'monitoring') return mockMonitoringRole;
				return mockSuperAdminRole;
			});
			mockRoleService.addPermissionToRole.mockResolvedValue(undefined);

			// Mock user operations
			mockUserService.findOneByEmail.mockResolvedValue(null);
			mockUserService.create.mockImplementation(async (userData) => {
				if (userData.email === 'monitoring@system.local') return mockMonitoringUser;
				return mockSuperAdminUser;
			});
			mockUserService.assignRoleToUser.mockResolvedValue(undefined);

			await service.seedDefaultData();

			expect(permissionService.seedDefaultPermissions).toHaveBeenCalled();
			expect(roleService.create).toHaveBeenCalled();
			expect(userService.create).toHaveBeenCalled();
		});

		it('should throw error when seeding fails', async () => {
			mockPermissionService.seedDefaultPermissions.mockRejectedValue(new Error('Seed error'));

			await expect(service.seedDefaultData()).rejects.toThrow('Seed error');
		});
	});

	describe('onModuleInit', () => {
		it('should call seedDefaultData on module initialization', async () => {
			const seedSpy = jest.spyOn(service, 'seedDefaultData').mockResolvedValue(undefined);

			await service.onModuleInit();

			expect(seedSpy).toHaveBeenCalled();
			seedSpy.mockRestore();
		});
	});
});
