// Standard incantation for React 18+ concurrent `act()` support in RN tests.
// react-native/jest/setup.js (part of the jest-expo preset) already sets
// this, but we set it explicitly here too since it's the officially
// documented knob (https://github.com/reactwg/react-18/discussions/102) and
// future test infra shouldn't have to depend on that being an implicit side
// effect of the preset.
global.IS_REACT_ACT_ENVIRONMENT = true;

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

require('react-native-reanimated').setUpTests();

// @testing-library/react-native's internal `wrapAsync` helper (used by both
// `render()` and `waitFor()` to flush pending microtasks from async effects)
// deliberately flips `IS_REACT_ACT_ENVIRONMENT` to `false` for the duration
// of that flush - see
// node_modules/@testing-library/react-native/dist/helpers/wrap-async.js.
// Any component state update that lands during that window (e.g. a mocked
// promise resolving inside a bootstrap-on-mount `useEffect`, which every
// screen wired to AuthContext will have) makes React's reconciler log this
// exact console.error, even though the update is correctly observed and
// flushed by `waitFor`/`render` immediately afterwards. This is not a
// symptom of a broken test, a race condition, or a missing global - it is
// an unavoidable, by-design side effect of this library's current
// async-flush implementation when testing async `useEffect` state
// machines. There is no test-side fix for it (setting the global above does
// not prevent RNTL from flipping it back off internally). Silence only this
// exact message; every other console.error still reaches the real one.
const ACT_ENVIRONMENT_WARNING =
  'The current testing environment is not configured to support act(...)';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith(ACT_ENVIRONMENT_WARNING)) {
    return;
  }
  originalConsoleError(...args);
};

// O demandStore (Zustand) é global: cada teste começa com a lista/filtros/cache vazios.
beforeEach(async () => {
  const store = jest.requireActual('./src/stores/demandStore');
  store.useDemandStore.getState().reset();
  // O cache offline (AsyncStorage) também começa vazio em cada teste.
  await require('@react-native-async-storage/async-storage').clear();
});

// AsyncStorage (cache offline) usa o mock em memória oficial da biblioteca.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-updates é nativo e fica desligado nos testes (como em desenvolvimento).
jest.mock('expo-updates', () => ({
  isEnabled: false,
  checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: false }),
  fetchUpdateAsync: jest.fn().mockResolvedValue({ isNew: false }),
  reloadAsync: jest.fn().mockResolvedValue(undefined),
}));

// expo-notifications depende de módulo nativo: nos testes, um mock que não faz nada
// (cada teste pode sobrescrever os retornos com mockResolvedValue).
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: false }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: false }),
  getExpoPushTokenAsync: jest.fn().mockRejectedValue(new Error('push indisponível nos testes')),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  useLastNotificationResponse: jest.fn(() => null),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  AndroidImportance: { HIGH: 4 },
}));
