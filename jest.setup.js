// Standard incantation for React 18+ concurrent `act()` support in RN tests.
// react-native/jest/setup.js (part of the jest-expo preset) already sets
// this, but we set it explicitly here too since it's the officially
// documented knob (https://github.com/reactwg/react-18/discussions/102) and
// future test infra shouldn't have to depend on that being an implicit side
// effect of the preset.
global.IS_REACT_ACT_ENVIRONMENT = true;

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
