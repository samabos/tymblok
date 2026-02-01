import '@testing-library/react-native';

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Link: ({ children }) => children,
  useLocalSearchParams: jest.fn(),
  useSegments: jest.fn(() => []),
  useRootNavigation: jest.fn(),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement(View, { testID: 'svg', ...props }, children),
    Svg: ({ children, ...props }) => React.createElement(View, { testID: 'svg', ...props }, children),
    Rect: (props) => React.createElement(View, { testID: 'rect', ...props }),
    Defs: ({ children }) => React.createElement(View, { testID: 'defs' }, children),
    LinearGradient: ({ children }) => React.createElement(View, { testID: 'linearGradient' }, children),
    Stop: () => React.createElement(View, { testID: 'stop' }),
    G: ({ children }) => React.createElement(View, { testID: 'g' }, children),
    Path: (props) => React.createElement(View, { testID: 'path', ...props }),
    Circle: (props) => React.createElement(View, { testID: 'circle', ...props }),
  };
});

// Mock TymblokLogo to avoid animation issues in tests
jest.mock('./components/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    TymblokLogo: () => React.createElement(View, { testID: 'tymblok-logo' }),
  };
});

// Silence console warnings in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
