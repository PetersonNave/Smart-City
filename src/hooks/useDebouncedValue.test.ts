import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(async () => jest.useFakeTimers());
  afterEach(async () => jest.useRealTimers());

  it('only updates after the value stops changing for the delay', async () => {
    const { result, rerender } = await renderHook(({ value }: { value: string }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'se' },
    });

    await rerender({ value: 'sem' });
    await act(() => {
      jest.advanceTimersByTime(300);
    });
    await rerender({ value: 'semaforo' });
    await act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('se');

    await act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('semaforo');
  });
});
