import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from './index';

const options = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDING', label: 'Pendente' },
] as const;

describe('SegmentedControl', () => {
  it('marks the active option as selected and reports presses', () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={[...options]} value="TODAS" onChange={onChange} testID="status" />);

    expect(screen.getByTestId('status-TODAS').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('status-PENDING').props.accessibilityState).toEqual({ selected: false });

    fireEvent.press(screen.getByTestId('status-PENDING'));
    expect(onChange).toHaveBeenCalledWith('PENDING');
  });
});
