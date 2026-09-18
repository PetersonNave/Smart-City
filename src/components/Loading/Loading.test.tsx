import { render } from '@testing-library/react-native';
import { Loading } from './index';

describe('Loading', () => {
  it('renders an activity indicator with the given color', () => {
    const { getByTestId } = render(<Loading color="#fff" testID="loading" />);
    expect(getByTestId('loading').props.color).toBe('#fff');
  });

  it('defaults to the primary brand color', () => {
    const { getByTestId } = render(<Loading testID="loading" />);
    expect(getByTestId('loading').props.color).toBe('#329D9C');
  });
});
