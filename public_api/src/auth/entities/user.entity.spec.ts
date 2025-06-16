import { User, AuthResponse } from './user.entity';

describe('User Entity', () => {
  it('should create a User instance', () => {
    const user = new User();
    user.id = 1;
    user.name = 'John Doe';
    user.email = 'john@example.com';

    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe(1);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });

  it('should have the correct properties', () => {
    const user = new User();
    
    // Verify that the class can have the expected properties assigned
    user.id = 1;
    user.name = 'Test';
    user.email = 'test@example.com';
    
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
  });
});

describe('AuthResponse Entity', () => {
  it('should create an AuthResponse instance', () => {
    const authResponse = new AuthResponse();
    authResponse.access_token = 'mockToken123';

    expect(authResponse).toBeInstanceOf(AuthResponse);
    expect(authResponse.access_token).toBe('mockToken123');
  });

  it('should have the correct properties', () => {
    const authResponse = new AuthResponse();
    
    // Verify that the class can have the expected properties assigned
    authResponse.access_token = 'test-token';
    
    expect(authResponse.access_token).toBeDefined();
  });
});
