import { loginSchema } from './LoginScreen.schema';

describe('loginSchema', () => {
  it('accepts a valid email and password', async () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', async () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });

    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });

    expect(result.success).toBe(false);
  });
});
