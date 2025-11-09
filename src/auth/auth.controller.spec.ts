import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserLoginDto } from '../user/model/user-login.dto';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: AuthService;

	const mockAuthService = {
		generateJwtToken: jest.fn(),
		validateUser: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		})
			.overrideGuard(LocalAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get<AuthService>(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('login', () => {
		it('should return access token on successful login', async () => {
			const loginDto: UserLoginDto = {
				email: 'test@example.com',
				password: 'password123',
			};
			const mockToken = { access_token: 'jwt.token.here' };

			mockAuthService.generateJwtToken.mockResolvedValue(mockToken);

			const result = await controller.login(loginDto);

			expect(result).toEqual(mockToken);
			expect(authService.generateJwtToken).toHaveBeenCalledWith(loginDto);
		});

		it('should call authService.generateJwtToken with login credentials', async () => {
			const loginDto: UserLoginDto = {
				email: 'admin@example.com',
				password: 'password123',
			};

			mockAuthService.generateJwtToken.mockResolvedValue({ access_token: 'token' });

			await controller.login(loginDto);

			expect(authService.generateJwtToken).toHaveBeenCalledWith(loginDto);
			expect(authService.generateJwtToken).toHaveBeenCalledTimes(1);
		});
	});
});
