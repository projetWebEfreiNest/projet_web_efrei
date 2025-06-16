import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: any;

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockAuthResponse = {
    access_token: 'mockToken',
  };

  const mockLoginResponse = {
    access_token: 'mockToken',
    user: mockUser,
  };

  beforeEach(async () => {
    const mockAuthService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      login: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      authService.create.mockResolvedValue(mockAuthResponse);

      const result = await resolver.createUser(createUserInput);

      expect(authService.create).toHaveBeenCalledWith(createUserInput);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'jane@example.com' },
      ];
      authService.findAll.mockResolvedValue(mockUsers);

      const result = await resolver.findAll();

      expect(authService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      authService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.findOne(1);

      expect(authService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserInput = {
        id: 1,
        name: 'John Updated',
      };
      const updatedUser = { ...mockUser, name: 'John Updated' };

      authService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(updateUserInput);

      expect(authService.update).toHaveBeenCalledWith(
        updateUserInput.id,
        updateUserInput,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('removeUser', () => {
    it('should remove a user', async () => {
      authService.remove.mockResolvedValue(mockUser);

      const result = await resolver.removeUser(1);

      expect(authService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should login a user and return access token', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await resolver.login('john@example.com', 'password123');

      expect(authService.login).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
      );
      expect(result).toBe('mockToken');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      authService.deleteUser.mockResolvedValue(mockUser);

      const result = await resolver.deleteUser(1);

      expect(authService.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });
});
