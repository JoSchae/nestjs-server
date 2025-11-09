import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException } from '@nestjs/common';

describe('UserController', () => {
	let controller: UserController;
	let service: UserService;

	const mockUser = {
		_id: '507f1f77bcf86cd799439011',
		email: 'test@example.com',
		firstName: 'John',
		lastName: 'Doe',
		roles: [],
		toObject: jest.fn().mockReturnValue({
			_id: '507f1f77bcf86cd799439011',
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			password: 'hashedPassword',
			roles: [],
		}),
	};

	const mockUserService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findById: jest.fn(),
		findOneByEmail: jest.fn(),
		findOneByEmailWithRoles: jest.fn(),
		findOneAndUpdate: jest.fn(),
		findOneAndDelete: jest.fn(),
		assignRoleToUser: jest.fn(),
		removeRoleFromUser: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: mockUserService,
				},
			],
		}).compile();

		controller = module.get<UserController>(UserController);
		service = module.get<UserService>(UserService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a user', async () => {
			const createDto: CreateUserDto = {
				email: 'test@example.com',
				password: 'Password123!',
				firstName: 'John',
				lastName: 'Doe',
			};

			mockUserService.findOneByEmail.mockResolvedValue(null);
			mockUserService.create.mockResolvedValue(mockUser);

			const result = await controller.create(createDto);

			expect(result).toBeDefined();
			expect(result.password).toBeUndefined();
			expect(service.findOneByEmail).toHaveBeenCalledWith({ email: createDto.email });
			expect(service.create).toHaveBeenCalledWith(createDto);
		});

		it('should throw ConflictException if user already exists', async () => {
			const createDto: CreateUserDto = {
				email: 'test@example.com',
				password: 'Password123!',
				firstName: 'John',
				lastName: 'Doe',
			};

			mockUserService.findOneByEmail.mockResolvedValue(mockUser);

			await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
			expect(service.create).not.toHaveBeenCalled();
		});
	});

	describe('getAllUsers', () => {
		it('should return an array of users', async () => {
			const mockUsers = [mockUser];
			mockUserService.findAll.mockResolvedValue(mockUsers);

			const result = await controller.getAllUsers();

			expect(result).toEqual(mockUsers);
			expect(service.findAll).toHaveBeenCalledTimes(1);
		});
	});

	describe('getProfile', () => {
		it('should return user profile without password', async () => {
			const req = { user: { email: 'test@example.com' } };
			mockUserService.findOneByEmailWithRoles.mockResolvedValue(mockUser);

			const result = await controller.getProfile(req);

			expect(result).toBeDefined();
			expect(result.password).toBeUndefined();
			expect(service.findOneByEmailWithRoles).toHaveBeenCalledWith(req.user.email);
		});
	});

	describe('getUserById', () => {
		it('should return a single user', async () => {
			const id = '507f1f77bcf86cd799439011';
			const userWithoutPassword = { ...mockUser };
			delete userWithoutPassword.toObject;
			mockUserService.findById.mockResolvedValue(userWithoutPassword);

			const result = await controller.getUserById(id);

			expect(result).toEqual(userWithoutPassword);
			expect(service.findById).toHaveBeenCalledWith(id);
		});
	});

	describe('updateProfile', () => {
		it('should update a user profile', async () => {
			const req = { user: { email: 'test@example.com' } };
			const updateDto: UpdateUserDto = {
				firstName: 'Jane',
			};

			mockUserService.findOneAndUpdate.mockResolvedValue({ ...mockUser, ...updateDto });

			const result = await controller.updateProfile(req, updateDto);

			expect(result.firstName).toBe('Jane');
			expect(service.findOneAndUpdate).toHaveBeenCalledWith({ email: req.user.email }, updateDto);
		});
	});

	describe('assignRole', () => {
		it('should assign a role to a user', async () => {
			const userId = '507f1f77bcf86cd799439011';
			const roleId = '507f1f77bcf86cd799439012';

			const userWithRole = {
				...mockUser,
				roles: [roleId],
			};
			delete userWithRole.toObject;

			mockUserService.assignRoleToUser.mockResolvedValue(userWithRole);

			const result = await controller.assignRole(userId, roleId);

			expect(result).toEqual(userWithRole);
			expect(service.assignRoleToUser).toHaveBeenCalledWith(userId, roleId);
		});
	});

	describe('removeRole', () => {
		it('should remove a role from a user', async () => {
			const userId = '507f1f77bcf86cd799439011';
			const roleId = '507f1f77bcf86cd799439012';

			const userWithoutRole = { ...mockUser };
			delete userWithoutRole.toObject;

			mockUserService.removeRoleFromUser.mockResolvedValue(userWithoutRole);

			const result = await controller.removeRole(userId, roleId);

			expect(result).toEqual(userWithoutRole);
			expect(service.removeRoleFromUser).toHaveBeenCalledWith(userId, roleId);
		});
	});

	describe('deleteProfile', () => {
		it('should delete user profile', async () => {
			const req = { user: { email: 'test@example.com' } };
			mockUserService.findOneAndDelete.mockResolvedValue(mockUser);

			await controller.deleteProfile(req);

			expect(service.findOneAndDelete).toHaveBeenCalledWith({ email: req.user.email });
		});
	});
});
