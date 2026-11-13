import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from './index';

const options = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDING', label: 'Pendente' },
] as const;

describe('SegmentedControl', () => {
  it('marks the active option as selected and reports presses', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={[...options]} value="TODAS" onChange={onChange} testID="status" />);

    expect(screen.getByTestId('status-TODAS').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('status-PENDING').props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(screen.getByTestId('status-PENDING'));
    expect(onChange).toHaveBeenCalledWith('PENDING');
  });
});
