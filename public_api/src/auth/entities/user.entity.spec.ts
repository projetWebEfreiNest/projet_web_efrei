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
});

describe('AuthResponse Entity', () => {
  it('should create an AuthResponse instance', () => {
    const authResponse = new AuthResponse();
    authResponse.access_token = 'mockToken123';

    expect(authResponse).toBeInstanceOf(AuthResponse);
    expect(authResponse.access_token).toBe('mockToken123');
  });
});
