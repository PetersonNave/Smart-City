import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { RootNavigator } from './RootNavigator';

jest.mock('../auth/AuthContext');

describe('RootNavigator', () => {
  it('shows the loading screen while bootstrapping', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'bootstrapping' });
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
    expect(screen.queryByText('Login')).toBeNull();
  });

  it('shows the auth stack when unauthenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'guest' });
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('shows the app tabs when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ status: 'authenticated' });
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
    expect(screen.getAllByText('Início').length).toBeGreaterThan(0);
  });
});
