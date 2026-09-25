// Router falso para testes de tela isolada (sem o Expo Router montado).
// Uso: `const mockRouter = createMockRouter();` + `jest.mock('expo-router', ...)` devolvendo-o
// em `useRouter` (variáveis começando com "mock" podem ser usadas dentro do jest.mock).
export function createMockRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    dismissTo: jest.fn(),
    dismissAll: jest.fn(),
    setParams: jest.fn(),
  };
}

export type MockRouter = ReturnType<typeof createMockRouter>;
