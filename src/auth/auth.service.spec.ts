import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockUsersService = {
  findByEmail: jest.fn(),
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue({
        id: 'uuid-123',
        name: 'Test User',
        email: 'test@gmail.com',
        role: 'USER',
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await authService.register(
        'Test User',
        'test@gmail.com',
        'password123',
      );

      expect(result.message).toBe('Registration successful');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('test@gmail.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@gmail.com',
      });

      await expect(
        authService.register('Test User', 'test@gmail.com', 'password123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-123',
        name: 'Test User',
        email: 'test@gmail.com',
        passwordHash: hashedPassword,
        role: 'USER',
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await authService.login('test@gmail.com', 'password123');

      expect(result.message).toBe('Login successful');
      expect(result.token).toBe('mock-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('notexist@gmail.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@gmail.com',
        passwordHash: hashedPassword,
        role: 'USER',
      });

      await expect(
        authService.login('test@gmail.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});