import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';

describe('AppTabs', () => {
  it('renders all four tabs with Início as the initial route', () => {
    render(
      <NavigationContainer>
        <AppTabs />
      </NavigationContainer>
    );

    expect(screen.getAllByText('Início').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mapa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demandas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Perfil').length).toBeGreaterThan(0);
  });
});
