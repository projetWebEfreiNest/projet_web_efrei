import { validate } from 'class-validator';
import { CreateAuthInput } from './create-auth.input';

describe('CreateAuthInput', () => {
  it('should validate a valid input', async () => {
    const input = new CreateAuthInput();
    input.name = 'John Doe';
    input.email = 'john@example.com';
    input.password = 'password123';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation if name is empty', async () => {
    const input = new CreateAuthInput();
    input.name = '';
    input.email = 'john@example.com';
    input.password = 'password123';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation if email is invalid', async () => {
    const input = new CreateAuthInput();
    input.name = 'John Doe';
    input.email = 'invalid-email';
    input.password = 'password123';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation if password is too short', async () => {
    const input = new CreateAuthInput();
    input.name = 'John Doe';
    input.email = 'john@example.com';
    input.password = '123';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation with multiple errors', async () => {
    const input = new CreateAuthInput();
    input.name = '';
    input.email = 'invalid-email';
    input.password = '123';

    const errors = await validate(input);
    expect(errors).toHaveLength(3);

    const properties = errors.map((error) => error.property);
    expect(properties).toContain('name');
    expect(properties).toContain('email');
    expect(properties).toContain('password');
  });
});
