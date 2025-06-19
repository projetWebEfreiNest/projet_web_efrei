import { Tag } from './tag.entity';

describe('Tag Entity', () => {
  it('should create a tag instance', () => {
    const tag = new Tag();
    tag.id = 1;
    tag.name = 'Test Tag';
    tag.description = 'Test Description';
    tag.colors = '#FF0000';
    tag.createdAt = new Date();
    tag.userId = 1;

    expect(tag).toBeInstanceOf(Tag);
    expect(tag.id).toBe(1);
    expect(tag.name).toBe('Test Tag');
    expect(tag.description).toBe('Test Description');
    expect(tag.colors).toBe('#FF0000');
    expect(tag.userId).toBe(1);
  });

  it('should be a valid entity class', () => {
    const tag = new Tag();
    expect(tag).toBeInstanceOf(Tag);
  });
});
