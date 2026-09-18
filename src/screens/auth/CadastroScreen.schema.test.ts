import { cadastroSchema } from './CadastroScreen.schema';

describe('cadastroSchema', () => {
  const base = {
    username: 'testuser',
    email: 'test@example.com',
    password: '123456',
    confirmPassword: '123456',
  };

  it('accepts valid, matching data', () => {
    expect(cadastroSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a username shorter than 3 characters', () => {
    expect(cadastroSchema.safeParse({ ...base, username: 'ab' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = cadastroSchema.safeParse({ ...base, confirmPassword: 'different' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword');
    }
  });
});
