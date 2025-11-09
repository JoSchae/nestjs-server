import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User } from './model/user.model';
import { PasswordService } from '../shared/password/password.service';
import { CacheService } from '../shared/cache/cache.service';
import { CacheInvalidationService } from '../shared/cache/cache-invalidation.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
	let service: UserService;
	let userModel: any;
	let passwordService: PasswordService;

	const mockUser = {
		_id: {
			toString: () => '507f1f77bcf86cd799439011',
		},
		email: 'test@example.com',
		firstName: 'John',
		lastName: 'Doe',
		password: 'hashedPassword',
		roles: [],
		isActive: true,
		save: jest.fn(),
		toObject: jest.fn().mockReturnValue({
			_id: '507f1f77bcf86cd799439011',
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			roles: [],
		}),
	};

	const mockUserModel: any = jest.fn().mockImplementation(() => ({
		save: jest.fn().mockResolvedValue(mockUser),
	}));
	Object.assign(mockUserModel, {
		find: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findOneAndUpdate: jest.fn(),
		findOneAndDelete: jest.fn(),
		countDocuments: jest.fn(),
		create: jest.fn(),
	});

	const mockPasswordService = {
		hash: jest.fn(),
		compare: jest.fn(),
	};

	const mockCacheService = {
		get: jest.fn(),
		set: jest.fn(),
		del: jest.fn(),
		wrap: jest.fn(),
	};

	const mockCacheInvalidation = {
		invalidateUser: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: getModelToken(User.name),
					useValue: mockUserModel,
				},
				{
					provide: PasswordService,
					useValue: mockPasswordService,
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

		service = module.get<UserService>(UserService);
		userModel = module.get(getModelToken(User.name));
		passwordService = module.get<PasswordService>(PasswordService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a new user', async () => {
			const createDto: CreateUserDto = {
				email: 'test@example.com',
				password: 'Password123!',
				firstName: 'John',
				lastName: 'Doe',
			};

			mockPasswordService.hash.mockResolvedValue('hashedPassword');
			mockUserModel.findOne.mockResolvedValue(null);

			const result = await service.create(createDto);

			expect(mockPasswordService.hash).toHaveBeenCalled();
			expect(mockPasswordService.hash).toHaveBeenCalledWith('Password123!');
			expect(result).toBeDefined();
			expect(result._id).toBeDefined();
		});

		it('should throw BadRequestException for invalid email', async () => {
			const createDto: CreateUserDto = {
				email: 'invalid-email',
				password: 'Password123!',
				firstName: 'John',
				lastName: 'Doe',
			};

			await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
		});
	});

	describe('findAll', () => {
		it('should return all users', async () => {
			const mockUsers = [mockUser];
			mockCacheService.get.mockResolvedValue(null);
			mockUserModel.find.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockReturnValue({
						exec: jest.fn().mockResolvedValue(mockUsers),
					}),
				}),
			});

			const result = await service.findAll();

			expect(mockUserModel.find).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return a user by id', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockUserModel.findById.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(mockUser),
				}),
			});

			const result = await service.findById(id);

			expect(mockUserModel.findById).toHaveBeenCalledWith(id);
			expect(result).toEqual(mockUser);
		});

		it('should throw NotFoundException if user not found', async () => {
			const id = '507f1f77bcf86cd799439011';
			mockCacheService.wrap.mockImplementation(async (key, fn) => await fn());
			mockUserModel.findById.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(null),
				}),
			});

			await expect(service.findById(id)).rejects.toThrow(NotFoundException);
		});
	});

	describe('findOneByEmail', () => {
		it('should find user by email', async () => {
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockResolvedValue(mockUser),
			});

			const result = await service.findOneByEmail({ email: 'test@example.com' });

			expect(result).toBeDefined();
			expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
		});

		it('should return user without password when withPassword is false', async () => {
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockResolvedValue(mockUser),
			});

			await service.findOneByEmail({ email: 'test@example.com' }, false);

			expect(mockUserModel.findOne).toHaveBeenCalled();
		});
	});

	describe('findOneAndUpdate', () => {
		it('should update a user', async () => {
			const query = { email: 'test@example.com' };
			const updateDto: UpdateUserDto = {
				firstName: 'Jane',
			};

			mockUserModel.findOneAndUpdate.mockResolvedValue({ ...mockUser, ...updateDto });

			const result = await service.findOneAndUpdate(query, updateDto);

			expect(mockUserModel.findOneAndUpdate).toHaveBeenCalled();
			expect(result.firstName).toBe('Jane');
		});

		it('should throw NotFoundException if user not found', async () => {
			const query = { email: 'nonexistent@example.com' };
			const updateDto: UpdateUserDto = { firstName: 'Jane' };

			mockUserModel.findOneAndUpdate.mockResolvedValue(null);

			await expect(service.findOneAndUpdate(query, updateDto)).rejects.toThrow(NotFoundException);
		});
	});

	describe('assignRoleToUser', () => {
		it('should assign a role to a user', async () => {
			const userId = '507f1f77bcf86cd799439011';
			const roleId = '507f1f77bcf86cd799439012';

			const userWithRoles = {
				...mockUser,
				roles: [roleId],
			};

			mockUserModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(userWithRoles),
				}),
			});

			const result = await service.assignRoleToUser(userId, roleId);

			expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
			expect(result).toBeDefined();
		});

		it('should throw NotFoundException if user not found', async () => {
			const userId = '507f1f77bcf86cd799439011';
			const roleId = '507f1f77bcf86cd799439012';

			mockUserModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(null),
				}),
			});

			await expect(service.assignRoleToUser(userId, roleId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('removeRoleFromUser', () => {
		it('should remove a role from a user', async () => {
			const userId = '507f1f77bcf86cd799439011';
			const roleId = '507f1f77bcf86cd799439012';

			const userWithRoles = {
				...mockUser,
				roles: [],
			};

			mockUserModel.findByIdAndUpdate.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue(userWithRoles),
				}),
			});

			const result = await service.removeRoleFromUser(userId, roleId);

			expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
			expect(result).toBeDefined();
		});
	});

	describe('findOneAndDelete', () => {
		it('should delete a user', async () => {
			const query = { email: 'test@example.com' };
			mockUserModel.findOneAndDelete.mockResolvedValue(mockUser);

			const result = await service.findOneAndDelete(query);

			expect(mockUserModel.findOneAndDelete).toHaveBeenCalledWith(query);
			expect(result).toEqual(mockUser);
		});

		it('should throw NotFoundException if user not found', async () => {
			const query = { email: 'nonexistent@example.com' };
			mockUserModel.findOneAndDelete.mockResolvedValue(null);

			await expect(service.findOneAndDelete(query)).rejects.toThrow(NotFoundException);
		});
	});
});
