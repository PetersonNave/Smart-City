// Mock lucide-react-native to avoid ESM parsing issues in Jest
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    House: (props) => React.createElement(View, props),
    MapPin: (props) => React.createElement(View, props),
    ClipboardList: (props) => React.createElement(View, props),
    User: (props) => React.createElement(View, props),
    Mail: (props) => React.createElement(View, props),
    Lock: (props) => React.createElement(View, props),
    Eye: (props) => React.createElement(View, props),
    EyeOff: (props) => React.createElement(View, props),
  };
});

// Mock @expo-google-fonts to avoid loading actual font files
jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
  Inter_800ExtraBold: 'Inter_800ExtraBold',
}));

jest.mock('@expo-google-fonts/source-sans-3', () => ({
  SourceSans3_400Regular: 'SourceSans3_400Regular',
  SourceSans3_800ExtraBold: 'SourceSans3_800ExtraBold',
}));

jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
  JetBrainsMono_400Regular: 'JetBrainsMono_400Regular',
  JetBrainsMono_800ExtraBold: 'JetBrainsMono_800ExtraBold',
}));

// Standard incantation for React 18+ concurrent `act()` support in RN tests.
global.IS_REACT_ACT_ENVIRONMENT = true;

const ACT_ENVIRONMENT_WARNING =
  'The current testing environment is not configured to support act(...)';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith(ACT_ENVIRONMENT_WARNING)) {
    return;
  }
  originalConsoleError(...args);
};
