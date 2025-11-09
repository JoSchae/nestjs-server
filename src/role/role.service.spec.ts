import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { RoleService } from './role.service';
import { Role } from './model/role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CacheService } from '../shared/cache/cache.service';
import { CacheInvalidationService } from '../shared/cache/cache-invalidation.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('RoleService', () => {
	let service: RoleService;
	let roleModel: any;

	const mockRole = {
		_id: '507f1f77bcf86cd799439011',
		name: 'admin',
		description: 'Administrator role',
		permissions: [],
		save: jest.fn(),
	};

	const mockRoleModel: any = jest.fn().mockImplementation(() => ({
		save: jest.fn().mockResolvedValue(mockRole),
	}));
	Object.assign(mockRoleModel, {
		find: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		create: jest.fn(),
	});

	const mockCacheService = {
		get: jest.fn(),
		set: jest.fn(),
		del: jest.fn(),
		wrap: jest.fn(),
	};

	const mockCacheInvalidation = {
		invalidateRole: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoleService,
				{
					provide: getModelToken(Role.name),
					useValue: mockRoleModel,
				},
				{
					provide: CacheService,
					useValue: mockCacheService,
				},
				{
					provide: CacheInvalidationService,
					useValue: mockCacheInvalidation,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<RoleService>(RoleService);
		roleModel = module.get(getModelToken(Role.name));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should throw BadRequestException if name is empty', async () => {
			const createDto: CreateRoleDto = {
				name: '',
				description: 'Test',
			};

			await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
		});

		it('should throw ConflictException if role already exists', async () => {
			const createDto: CreateRoleDto = {
				name: 'admin',
				description: 'Administrator role',
			};

			mockRoleModel.findOne.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockRole),
			});

			await expect(service.create(createDto)).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return all roles from cache if available', async () => {
			const mockRoles = [mockRole];
			mockCacheService.wrap.mockResolvedValue(mockRoles);

			const result = await service.findAll();

			expect(result).toEqual(mockRoles);
			expect(mockCacheService.wrap).toHaveBeenCalled();
		});

		it('should fetch from database if cache misses', async () => {
			const mockRoles = [mockRole];
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockRoleModel.find.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockReturnValue({
						exec: jest.fn().mockResolvedValue(mockRoles),
					}),
				}),
			});

			const result = await service.findAll();

			expect(mockRoleModel.find).toHaveBeenCalled();
			expect(result).toEqual(mockRoles);
		});
	});

	describe('findOne', () => {
		it('should return a role by id', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockRoleModel.findById.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(mockRole),
				}),
			});

			const result = await service.findOne(id);

			expect(mockRoleModel.findById).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockRole);
		});

		it('should throw NotFoundException if role not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockRoleModel.findById.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(null),
				}),
			});

			await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('should update a role', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdateRoleDto = {
				description: 'Updated description',
			};

			mockRoleModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(mockRole),
				}),
			});

			await service.update(id, updateDto);

			expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalled();
		});

		it('should throw NotFoundException if role not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdateRoleDto = {
				description: 'Updated',
			};

			mockRoleModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(null),
				}),
			});

			await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete a role', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockRoleModel.findByIdAndDelete.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockRole),
			});

			await service.remove(id);

			expect(mockRoleModel.findByIdAndDelete).toHaveBeenCalledWith(id);
		});

		it('should throw NotFoundException if role not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockRoleModel.findByIdAndDelete.mockReturnValue({
				exec: jest.fn().mockResolvedValue(null),
			});

			await expect(service.remove(id)).rejects.toThrow(NotFoundException);
		});
	});

	describe('addPermissionToRole', () => {
		it('should add permission to role', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';

			const roleWithPermissions = {
				...mockRole,
				permissions: [],
			};

			// Mock findById for initial check
			mockRoleModel.findById.mockReturnValue({
				exec: jest.fn().mockResolvedValue(roleWithPermissions),
			});

			// Mock findByIdAndUpdate for the actual update
			mockRoleModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue({ ...roleWithPermissions, permissions: [permissionId] }),
				}),
			});

			await service.addPermissionToRole(roleId, permissionId);

			expect(mockRoleModel.findById).toHaveBeenCalledWith(roleId);
			expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalled();
		});

		it('should throw NotFoundException if role not found', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';

			mockRoleModel.findById.mockResolvedValue(null);

			await expect(service.addPermissionToRole(roleId, permissionId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('removePermissionFromRole', () => {
		it('should remove permission from role', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';

			const roleWithPermissions = {
				...mockRole,
				permissions: [],
			};

			mockRoleModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(roleWithPermissions),
				}),
			});

			await service.removePermissionFromRole(roleId, permissionId);

			expect(mockRoleModel.findByIdAndUpdate).toHaveBeenCalled();
		});

		it('should throw NotFoundException if role not found', async () => {
			const roleId = '507f1f77bcf86cd799439011';
			const permissionId = '507f1f77bcf86cd799439012';

			mockRoleModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(null),
				}),
			});

			await expect(service.removePermissionFromRole(roleId, permissionId)).rejects.toThrow(NotFoundException);
		});
	});
});
