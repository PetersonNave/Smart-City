import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'se' },
    });

    rerender({ value: 'sem' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    rerender({ value: 'semaforo' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('se');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('semaforo');
  });
});
