import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from './index';

describe('StatusBadge', () => {
  it.each([
    ['PENDING', 'PENDENTE', '#FFF4E5'],
    ['IN_PROGRESS', 'EM ANÁLISE', '#E0F2F1'],
    ['RESOLVED', 'CONCLUÍDA', '#E8F5E9'],
  ] as const)('renders %s as "%s" with the Figma background', (status, label, background) => {
    render(<StatusBadge status={status} testID="badge" />);

    expect(screen.getByText(label)).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('badge').props.style).backgroundColor).toBe(background);
  });
});
