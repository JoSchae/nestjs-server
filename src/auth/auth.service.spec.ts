import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../shared/password/password.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
	let service: AuthService;
	let userService: UserService;
	let jwtService: JwtService;
	let passwordService: PasswordService;

	const mockUser = {
		_id: '507f1f77bcf86cd799439011',
		email: 'test@example.com',
		password: 'hashedPassword',
		firstName: 'John',
		lastName: 'Doe',
		roles: [],
		isActive: true,
	};

	const mockUserService = {
		findOneByEmail: jest.fn(),
		findOneByEmailWithRoles: jest.fn(),
		updateLastLogin: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(),
		verify: jest.fn(),
	};

	const mockPasswordService = {
		compare: jest.fn(),
		hash: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UserService,
					useValue: mockUserService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: PasswordService,
					useValue: mockPasswordService,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		userService = module.get<UserService>(UserService);
		jwtService = module.get<JwtService>(JwtService);
		passwordService = module.get<PasswordService>(PasswordService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('validateUser', () => {
		it('should validate user with correct credentials', async () => {
			mockUserService.findOneByEmail.mockResolvedValue(mockUser);
			mockPasswordService.compare.mockResolvedValue(true);

			const result = await service.validateUser('test@example.com', 'password123');

			expect(result).toBeDefined();
			expect(result.email).toBe(mockUser.email);
			expect(userService.findOneByEmail).toHaveBeenCalledWith({ email: 'test@example.com' });
		});

		it('should throw BadRequestException for empty email', async () => {
			await expect(service.validateUser('', 'password123')).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException for empty password', async () => {
			await expect(service.validateUser('test@example.com', '')).rejects.toThrow(BadRequestException);
		});

		it('should throw UnauthorizedException for invalid email', async () => {
			mockUserService.findOneByEmail.mockResolvedValue(null);

			await expect(service.validateUser('wrong@example.com', 'password123')).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should throw UnauthorizedException for invalid password', async () => {
			mockUserService.findOneByEmail.mockResolvedValue(mockUser);
			mockPasswordService.compare.mockResolvedValue(false);

			await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('generateJwtToken', () => {
		it('should return access token on successful login', async () => {
			const loginDto = { email: 'test@example.com', password: 'password123' };
			const mockToken = 'jwt.token.here';

			mockUserService.findOneByEmailWithRoles.mockResolvedValue(mockUser);
			mockJwtService.sign.mockReturnValue(mockToken);

			const result = await service.generateJwtToken(loginDto);

			expect(result).toEqual({ access_token: mockToken });
			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					email: mockUser.email,
					userId: mockUser._id.toString(),
				}),
			);
		});

		it('should include roles in JWT payload', async () => {
			const loginDto = { email: 'test@example.com', password: 'password123' };
			const userWithRoles = {
				...mockUser,
				roles: [{ _id: 'roleId', name: 'admin', permissions: [] }],
				isActive: true,
			};

			mockUserService.findOneByEmailWithRoles.mockResolvedValue(userWithRoles);
			mockJwtService.sign.mockReturnValue('token');

			await service.generateJwtToken(loginDto);

			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					roles: ['admin'],
				}),
			);
		});
	});
});
