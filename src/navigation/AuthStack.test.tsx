import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';

describe('AuthStack', () => {
  it('starts on Login and navigates to Cadastro', () => {
    render(
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );

    expect(screen.getByText('Login')).toBeTruthy();
    fireEvent.press(screen.getByTestId('go-to-cadastro'));
    expect(screen.getByText('Cadastro')).toBeTruthy();
  });
});
