import * as SecureStore from 'expo-secure-store';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './storage';

jest.mock('expo-secure-store');

describe('storage', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns null when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await getStoredTokens()).toBeNull();
  });

  it('parses the stored JSON tokens', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'b' };
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(tokens));
    expect(await getStoredTokens()).toEqual(tokens);
  });

  it('stores tokens as JSON under the expected key', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'b' };
    await setStoredTokens(tokens);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'resolveai.auth.tokens',
      JSON.stringify(tokens)
    );
  });

  it('deletes the stored key on clear', async () => {
    await clearStoredTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('resolveai.auth.tokens');
  });
});
