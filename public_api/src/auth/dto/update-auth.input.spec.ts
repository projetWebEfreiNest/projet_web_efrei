import { validate } from 'class-validator';
import { UpdateAuthInput } from './update-auth.input';

describe('UpdateAuthInput', () => {
  it('should validate a valid input with all fields', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.name = 'John Doe Updated';
    input.email = 'john.updated@example.com';
    input.password = 'newpassword123';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid input with only id and name', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.name = 'John Doe Updated';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid input with only id and email', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.email = 'john.updated@example.com';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid input with only id and password', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.password = 'newpassword123';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation if email is invalid', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.email = 'invalid-email';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation if password is too short', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.password = '123';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation if name is empty string', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;
    input.name = '';

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
  });

  it('should pass validation with only id (all other fields optional)', async () => {
    const input = new UpdateAuthInput();
    input.id = 1;

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });
});
