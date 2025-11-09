import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from './permission.service';
import { Permission, PermissionAction, PermissionResource } from './model/permission.model';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CacheService } from '../shared/cache/cache.service';
import { CacheInvalidationService } from '../shared/cache/cache-invalidation.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('PermissionService', () => {
	let service: PermissionService;
	let permissionModel: any;
	let cacheService: CacheService;
	let cacheInvalidation: CacheInvalidationService;

	const mockPermission = {
		_id: '507f1f77bcf86cd799439011',
		name: 'user:read',
		action: PermissionAction.READ,
		resource: PermissionResource.USER,
		description: 'Read user data',
		save: jest.fn(),
		toObject: jest.fn(),
	};

	const mockPermissionModel: any = jest.fn().mockImplementation(() => ({
		save: jest.fn().mockResolvedValue(mockPermission),
	}));
	Object.assign(mockPermissionModel, {
		find: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		create: jest.fn(),
		exec: jest.fn(),
	});

	const mockCacheService = {
		get: jest.fn(),
		set: jest.fn(),
		del: jest.fn(),
		wrap: jest.fn(),
	};

	const mockCacheInvalidation = {
		invalidatePermission: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PermissionService,
				{
					provide: getModelToken(Permission.name),
					useValue: mockPermissionModel,
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

		service = module.get<PermissionService>(PermissionService);
		permissionModel = module.get(getModelToken(Permission.name));
		cacheService = module.get<CacheService>(CacheService);
		cacheInvalidation = module.get<CacheInvalidationService>(CacheInvalidationService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a permission successfully', async () => {
			const createDto: CreatePermissionDto = {
				name: 'user:read',
				action: PermissionAction.READ,
				resource: PermissionResource.USER,
				description: 'Read user data',
			};

			mockPermissionModel.findOne.mockResolvedValue(null);

			const result = await service.create(createDto);

			expect(mockPermissionModel.findOne).toHaveBeenCalled();
			expect(result).toBeDefined();
		});

		it('should throw BadRequestException if name is empty', async () => {
			const createDto: CreatePermissionDto = {
				name: '',
				action: PermissionAction.READ,
				resource: PermissionResource.USER,
			};

			await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
		});

		it('should throw ConflictException if permission already exists', async () => {
			const createDto: CreatePermissionDto = {
				name: 'user:read',
				action: PermissionAction.READ,
				resource: PermissionResource.USER,
			};

			mockPermissionModel.findOne.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockPermission),
			});

			await expect(service.create(createDto)).rejects.toThrow(ConflictException);
		});
	});

	describe('findAll', () => {
		it('should return all permissions from cache if available', async () => {
			const mockPermissions = [mockPermission];
			mockCacheService.wrap.mockResolvedValue(mockPermissions);

			const result = await service.findAll();

			expect(result).toEqual(mockPermissions);
			expect(cacheService.wrap).toHaveBeenCalled();
		});

		it('should fetch from database if cache misses', async () => {
			const mockPermissions = [mockPermission];
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockPermissionModel.find.mockReturnValue({
				lean: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(mockPermissions),
				}),
			});

			const result = await service.findAll();

			expect(mockPermissionModel.find).toHaveBeenCalled();
			expect(result).toEqual(mockPermissions);
		});
	});

	describe('findOne', () => {
		it('should return a permission by id', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockPermissionModel.findById.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockPermission),
			});

			const result = await service.findOne(id);

			expect(mockPermissionModel.findById).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockPermission);
		});

		it('should throw NotFoundException if permission not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockPermissionModel.findById.mockReturnValue({
				exec: jest.fn().mockResolvedValue(null),
			});

			await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('should update a permission', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdatePermissionDto = {
				description: 'Updated description',
			};

			mockPermissionModel.findByIdAndUpdate.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockPermission),
			});

			await service.update(id, updateDto);

			expect(mockPermissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
				id,
				expect.any(Object),
				expect.any(Object),
			);
		});

		it('should throw NotFoundException if permission not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdatePermissionDto = {
				description: 'Updated',
			};

			mockPermissionModel.findByIdAndUpdate.mockReturnValue({
				exec: jest.fn().mockResolvedValue(null),
			});

			await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete a permission', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockPermissionModel.findByIdAndDelete.mockReturnValue({
				exec: jest.fn().mockResolvedValue(mockPermission),
			});

			await service.remove(id);

			expect(mockPermissionModel.findByIdAndDelete).toHaveBeenCalledWith(id);
		});

		it('should throw NotFoundException if permission not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockPermissionModel.findByIdAndDelete.mockReturnValue({
				exec: jest.fn().mockResolvedValue(null),
			});

			await expect(service.remove(id)).rejects.toThrow(NotFoundException);
		});
	});
});
