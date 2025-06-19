import { validate } from 'class-validator';
import { UpdateTagInput } from './update-tag.input';

describe('UpdateTagInput', () => {
  it('should be valid with id only', async () => {
    const input = new UpdateTagInput();
    input.id = 1;

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with id and partial fields', async () => {
    const input = new UpdateTagInput();
    input.id = 1;
    input.name = 'Updated Tag';
    input.description = 'Updated Description';

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should be invalid without id', async () => {
    const input = new UpdateTagInput();
    input.name = 'Updated Tag';

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should be invalid with non-integer id', async () => {
    const input = new UpdateTagInput();
    input.id = 'not-a-number' as any;

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should inherit validation from CreateTagInput', async () => {
    const input = new UpdateTagInput();
    input.id = 1;
    input.name = ''; // Empty name should be invalid

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });
});
