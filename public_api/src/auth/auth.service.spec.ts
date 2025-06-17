import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
  };

  const mockUserWithoutPassword = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAuthInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      prismaService.user.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mockToken');

      const result = await service.create(createAuthInput);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createAuthInput.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createAuthInput.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createAuthInput,
          password: 'hashedPassword',
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        access_token: 'mockToken',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createAuthInput)).rejects.toThrow(
        new ConflictException('Cet email est déjà utilisé'),
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'jane@example.com' },
      ];
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Utilisateur 999 introuvable'),
      );
    });
  });

  describe('update', () => {
    const updateAuthInput = {
      id: 1,
      name: 'John Updated',
    };

    it('should update a user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, name: 'John Updated' };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateAuthInput);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateAuthInput,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateAuthInput)).rejects.toThrow(
        new NotFoundException('Utilisateur 999 introuvable'),
      );

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Utilisateur 999 introuvable'),
      );

      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(
        'john@example.com',
        'password123',
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        'john@example.com',
        'wrongpassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user if credentials are valid', async () => {
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('mockToken');

      const result = await service.login('john@example.com', 'password123');

      expect(service.validateUser).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserWithoutPassword.id,
        email: mockUserWithoutPassword.email,
      });
      expect(result).toEqual({
        access_token: 'mockToken',
        user: mockUserWithoutPassword,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login('john@example.com', 'wrongpassword'),
      ).rejects.toThrow(
        new UnauthorizedException('Email ou mot de passe invalide'),
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });
});
