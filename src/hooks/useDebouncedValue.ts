import { useEffect, useState } from 'react';

/** Devolve `value` só depois de `delay` ms sem mudanças (ex.: não buscar a cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
