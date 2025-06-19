import { validate } from 'class-validator';
import { CreateTagInput } from './create-tag.input';

describe('CreateTagInput', () => {
  it('should be valid with required fields', async () => {
    const input = new CreateTagInput();
    input.name = 'Test Tag';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with all fields', async () => {
    const input = new CreateTagInput();
    input.name = 'Test Tag';
    input.description = 'Test Description';
    input.colors = '#FF0000';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should be invalid with empty name', async () => {
    const input = new CreateTagInput();
    input.name = '';

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should be invalid without name', async () => {
    const input = new CreateTagInput();

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should be valid with optional fields as undefined', async () => {
    const input = new CreateTagInput();
    input.name = 'Test Tag';
    input.description = undefined;
    input.colors = undefined;

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });
});
