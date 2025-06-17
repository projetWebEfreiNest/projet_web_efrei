import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

describe('AuthResolver (e2e)', () => {
  let app: INestApplication;
  let prismaService: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        }),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<any>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser mutation', () => {
    const createUserMutation = `
      mutation CreateUser($createUserInput: CreateAuthInput!) {
        createUser(createUserInput: $createUserInput) {
          access_token
        }
      }
    `;

    it('should create a new user', () => {
      const createUserInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createUserMutation,
          variables: { createUserInput },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createUser).toHaveProperty('access_token');
          expect(typeof res.body.data.createUser.access_token).toBe('string');
        });
    });

    it('should return error if email already exists', () => {
      const createUserInput = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: 1,
        name: 'Existing User',
        email: 'john@example.com',
        password: 'hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createUserMutation,
          variables: { createUserInput },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain(
            'Cet email est déjà utilisé',
          );
        });
    });
  });

  describe('users query', () => {
    const usersQuery = `
      query Users {
        users {
          id
          name
          email
        }
      }
    `;

    it('should return all users', () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
      ];

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({ query: usersQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.users).toEqual(mockUsers);
        });
    });
  });

  describe('user query', () => {
    const userQuery = `
      query User($id: Int!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `;

    it('should return a specific user', () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: userQuery,
          variables: { id: 1 },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.user).toEqual(mockUser);
        });
    });

    it('should return error if user not found', () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: userQuery,
          variables: { id: 999 },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain(
            'Utilisateur 999 introuvable',
          );
        });
    });
  });

  describe('login mutation', () => {
    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password)
      }
    `;

    it('should login successfully with valid credentials', () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2b$10$hashedPassword',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            email: 'john@example.com',
            password: 'password123',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.data.login).toBe('string');
        });
    });

    it('should return error with invalid credentials', () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            email: 'wrong@example.com',
            password: 'wrongpassword',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain(
            'Email ou mot de passe invalide',
          );
        });
    });
  });

  describe('updateUser mutation', () => {
    const updateUserMutation = `
      mutation UpdateUser($updateUserInput: UpdateAuthInput!) {
        updateUser(updateUserInput: $updateUserInput) {
          id
          name
          email
        }
      }
    `;

    it('should update a user successfully', () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      const updatedUser = {
        id: 1,
        name: 'John Updated',
        email: 'john@example.com',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateUserMutation,
          variables: {
            updateUserInput: {
              id: 1,
              name: 'John Updated',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.updateUser).toEqual(updatedUser);
        });
    });
  });

  describe('removeUser mutation', () => {
    const removeUserMutation = `
      mutation RemoveUser($id: Int!) {
        removeUser(id: $id) {
          id
          name
          email
        }
      }
    `;

    it('should remove a user successfully', () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: removeUserMutation,
          variables: { id: 1 },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.removeUser).toEqual(mockUser);
        });
    });
  });
});
