// Mock types for testing
export type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

export type MockAuthService = {
  create: jest.Mock;
  findAll: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  login: jest.Mock;
  deleteUser: jest.Mock;
  validateUser: jest.Mock;
};

export type MockJwtService = {
  sign: jest.Mock;
  verify: jest.Mock;
};
