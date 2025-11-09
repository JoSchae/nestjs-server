import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionAction, PermissionResource } from './model/permission.model';

describe('PermissionController', () => {
	let controller: PermissionController;
	let service: PermissionService;

	const mockPermission = {
		_id: '507f1f77bcf86cd799439011',
		name: 'user:read',
		action: PermissionAction.READ,
		resource: PermissionResource.USER,
		description: 'Read user data',
	};

	const mockPermissionService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		seedDefaultPermissions: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PermissionController],
			providers: [
				{
					provide: PermissionService,
					useValue: mockPermissionService,
				},
			],
		}).compile();

		controller = module.get<PermissionController>(PermissionController);
		service = module.get<PermissionService>(PermissionService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a permission', async () => {
			const createDto: CreatePermissionDto = {
				name: 'user:read',
				action: PermissionAction.READ,
				resource: PermissionResource.USER,
				description: 'Read user data',
			};

			mockPermissionService.create.mockResolvedValue(mockPermission);

			const result = await controller.create(createDto);

			expect(result).toEqual(mockPermission);
			expect(service.create).toHaveBeenCalledWith(createDto);
			expect(service.create).toHaveBeenCalledTimes(1);
		});
	});

	describe('findAll', () => {
		it('should return an array of permissions', async () => {
			const mockPermissions = [mockPermission];
			mockPermissionService.findAll.mockResolvedValue(mockPermissions);

			const result = await controller.findAll();

			expect(result).toEqual(mockPermissions);
			expect(service.findAll).toHaveBeenCalledTimes(1);
		});
	});

	describe('findOne', () => {
		it('should return a single permission', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockPermissionService.findOne.mockResolvedValue(mockPermission);

			const result = await controller.findOne(id);

			expect(result).toEqual(mockPermission);
			expect(service.findOne).toHaveBeenCalledWith(id);
			expect(service.findOne).toHaveBeenCalledTimes(1);
		});
	});

	describe('update', () => {
		it('should update a permission', async () => {
			const id = '507f1f77bcf86cd799439011';
			const updateDto: UpdatePermissionDto = {
				description: 'Updated description',
			};
			const updatedPermission = { ...mockPermission, ...updateDto };

			mockPermissionService.update.mockResolvedValue(updatedPermission);

			const result = await controller.update(id, updateDto);

			expect(result).toEqual(updatedPermission);
			expect(service.update).toHaveBeenCalledWith(id, updateDto);
			expect(service.update).toHaveBeenCalledTimes(1);
		});
	});

	describe('remove', () => {
		it('should delete a permission', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockPermissionService.remove.mockResolvedValue(mockPermission);

			const result = await controller.remove(id);

			expect(result).toEqual(mockPermission);
			expect(service.remove).toHaveBeenCalledWith(id);
			expect(service.remove).toHaveBeenCalledTimes(1);
		});
	});

	describe('seedDefaultPermissions', () => {
		it('should seed default permissions', async () => {
			mockPermissionService.seedDefaultPermissions.mockResolvedValue(undefined);

			await controller.seedDefaultPermissions();

			expect(service.seedDefaultPermissions).toHaveBeenCalledTimes(1);
		});
	});
});
