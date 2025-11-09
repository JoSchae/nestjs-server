import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('RoleController', () => {
	let controller: RoleController;
	let service: RoleService;

	const mockRole = {
		_id: '507f1f77bcf86cd799439011',
		name: 'admin',
		description: 'Administrator role',
		permissions: [],
	};

	const mockRoleService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		addPermissionToRole: jest.fn(),
		removePermissionFromRole: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [RoleController],
			providers: [
				{
					provide: RoleService,
					useValue: mockRoleService,
				},
			],
		}).compile();

		controller = module.get<RoleController>(RoleController);
		service = module.get<RoleService>(RoleService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a role', async () => {
			const createDto: CreateRoleDto = {
				name: 'admin',
				description: 'Administrator role',
			};

			mockRoleService.create.mockResolvedValue(mockRole);

			const result = await controller.create(createDto);

			expect(result).toEqual(mockRole);
			expect(service.create).toHaveBeenCalledWith(createDto);
			expect(service.create).toHaveBeenCalledTimes(1);
		});
	});

	describe('findAll', () => {
		it('should return an array of roles', async () => {
			const mockRoles = [mockRole];
			mockRoleService.findAll.mockResolvedValue(mockRoles);

			const result = await controller.findAll();

			expect(result).toEqual(mockRoles);
			expect(service.findAll).toHaveBeenCalledTimes(1);
		});
	});

	describe('findOne', () => {
		it('should return a single role', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockRoleService.findOne.mockResolvedValue(mockRole);

			const result = await controller.findOne(id);

			expect(result).toEqual(mockRole);
			expect(service.findOne).toHaveBeenCalledWith(id);
			expect(service.findOne).toHaveBeenCalledTimes(1);
		});
	});

	describe('update', () => {
		it('should update a role', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdateRoleDto = {
				description: 'Updated description',
			};
			const updatedRole = { ...mockRole, ...updateDto };

			mockRoleService.update.mockResolvedValue(updatedRole);

			const result = await controller.update(id, updateDto);

			expect(result).toEqual(updatedRole);
			expect(service.update).toHaveBeenCalledWith(id, updateDto);
			expect(service.update).toHaveBeenCalledTimes(1);
		});
	});

	describe('remove', () => {
		it('should delete a role', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockRoleService.remove.mockResolvedValue(mockRole);

			const result = await controller.remove(id);

			expect(result).toEqual(mockRole);
			expect(service.remove).toHaveBeenCalledWith(id);
			expect(service.remove).toHaveBeenCalledTimes(1);
		});
	});

	describe('addPermission', () => {
		it('should add permission to role', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';
			const roleWithPermission = {
				...mockRole,
				permissions: [permissionId],
			};

			mockRoleService.addPermissionToRole.mockResolvedValue(roleWithPermission);

			const result = await controller.addPermission(roleId, permissionId);

			expect(result).toEqual(roleWithPermission);
			expect(service.addPermissionToRole).toHaveBeenCalledWith(roleId, permissionId);
			expect(service.addPermissionToRole).toHaveBeenCalledTimes(1);
		});
	});

	describe('removePermission', () => {
		it('should remove permission from role', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';

			mockRoleService.removePermissionFromRole.mockResolvedValue(mockRole);

			const result = await controller.removePermission(roleId, permissionId);

			expect(result).toEqual(mockRole);
			expect(service.removePermissionFromRole).toHaveBeenCalledWith(roleId, permissionId);
			expect(service.removePermissionFromRole).toHaveBeenCalledTimes(1);
		});
	});
});
