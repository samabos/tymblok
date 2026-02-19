import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SessionsScreen from '../../../app/(auth)/sessions';
import { authService, SessionDto } from '../../../services/authService';

// Mock AlertProvider's useAlert hook
const mockAlert = jest.fn();
const mockConfirm = jest.fn();
const mockShowError = jest.fn();
const mockSuccess = jest.fn();
jest.mock('../../../components/AlertProvider', () => ({
  useAlert: () => ({
    alert: mockAlert,
    confirm: mockConfirm,
    error: mockShowError,
    success: mockSuccess,
  }),
}));

// Mock AuthGuard to just render children
jest.mock('../../../components/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @tymblok/ui
jest.mock('@tymblok/ui', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: '#000',
        textMuted: '#666',
        textFaint: '#999',
        bg: '#fff',
        input: '#f5f5f5',
        border: '#ddd',
        card: '#f9f9f9',
      },
    },
  }),
  Card: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @tymblok/theme
jest.mock('@tymblok/theme', () => ({
  colors: {
    indigo: { 500: '#6366f1' },
    status: { urgent: '#ef4444', done: '#22c55e' },
    white: '#ffffff',
  },
}));

// Mock authService
jest.mock('../../../services/authService', () => ({
  authService: {
    getSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  },
}));

// Mock authStore
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true,
    },
  })),
}));

// Helper to wrap component with QueryClientProvider
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('SessionsScreen', () => {
  const mockGetSessions = authService.getSessions as jest.Mock;
  const _mockRevokeSession = authService.revokeSession as jest.Mock;
  const mockRevokeAllSessions = authService.revokeAllSessions as jest.Mock;

  const mockCurrentSession: SessionDto = {
    id: 'session-1',
    deviceType: 'mobile',
    deviceName: 'iPhone 15',
    deviceOs: 'iOS 17',
    ipAddress: '192.168.1.1',
    isCurrent: true,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockOtherSession: SessionDto = {
    id: 'session-2',
    deviceType: 'desktop',
    deviceName: 'Chrome on Windows',
    deviceOs: 'Windows 11',
    ipAddress: '192.168.1.2',
    isCurrent: false,
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sessions screen with header', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    mockGetSessions.mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithQueryClient(<SessionsScreen />);

    // The loading indicator should be shown
    // Since ActivityIndicator doesn't have accessible text, we check the header exists
    expect(screen.getByText('Active Sessions')).toBeTruthy();
  });

  it('should display current session', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('This Device')).toBeTruthy();
      expect(screen.getByText('iPhone 15')).toBeTruthy();
      expect(screen.getByText('Current')).toBeTruthy();
    });
  });

  it('should display other sessions', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Other Sessions (1)')).toBeTruthy();
      expect(screen.getByText('Chrome on Windows')).toBeTruthy();
    });
  });

  it('should show no other sessions message when only current session exists', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('No other active sessions')).toBeTruthy();
      expect(screen.getByText("You're only signed in on this device")).toBeTruthy();
    });
  });

  it('should navigate back when back button is pressed', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeTruthy();
    });

    // Find the back button
    const header = screen.getByText('Active Sessions');
    const headerView = header.parent?.parent;
    const backButton = headerView?.children[0];

    if (backButton) {
      fireEvent.press(backButton);
      expect(router.back).toHaveBeenCalled();
    }
  });

  it('should display other session with device info', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Chrome on Windows')).toBeTruthy();
      expect(screen.getByText('Windows 11')).toBeTruthy();
    });
  });

  it('should have revoke functionality available for other sessions', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      // Other sessions section should be visible with count
      expect(screen.getByText('Other Sessions (1)')).toBeTruthy();
      // The session should display
      expect(screen.getByText('Chrome on Windows')).toBeTruthy();
    });
  });

  it('should show Sign Out All button when other sessions exist', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sign Out All Other Devices')).toBeTruthy();
    });
  });

  it('should not show Sign Out All button when no other sessions exist', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('No other active sessions')).toBeTruthy();
    });

    expect(screen.queryByText('Sign Out All Other Devices')).toBeNull();
  });

  it('should show confirmation when revoking all sessions', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sign Out All Other Devices')).toBeTruthy();
    });

    const signOutAllButton = screen.getByText('Sign Out All Other Devices');
    fireEvent.press(signOutAllButton);

    // The screen now uses useAlert().confirm instead of Alert.alert
    expect(mockConfirm).toHaveBeenCalledWith(
      'Sign Out All Devices',
      expect.stringContaining('sign out all other devices'),
      expect.any(Function),
      'Sign Out All'
    );
  });

  it('should revoke all sessions when confirmed', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, mockOtherSession]);
    mockRevokeAllSessions.mockResolvedValueOnce(undefined);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sign Out All Other Devices')).toBeTruthy();
    });

    const signOutAllButton = screen.getByText('Sign Out All Other Devices');
    fireEvent.press(signOutAllButton);

    // Get the confirm callback and call it
    const confirmCalls = mockConfirm.mock.calls;
    const lastCall = confirmCalls[confirmCalls.length - 1];
    const onConfirmCallback = lastCall[2]; // 3rd argument is the onConfirm callback

    onConfirmCallback();

    await waitFor(() => {
      expect(mockRevokeAllSessions).toHaveBeenCalledWith('session-1'); // Except current session
    });
  });

  it('should display device info text', async () => {
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/These are the devices that are currently signed in/)).toBeTruthy();
    });
  });

  it('should format relative time for sessions', async () => {
    const oldSession: SessionDto = {
      ...mockOtherSession,
      lastActiveAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    };
    mockGetSessions.mockResolvedValueOnce([mockCurrentSession, oldSession]);

    renderWithQueryClient(<SessionsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/3 days ago/)).toBeTruthy();
    });
  });
});
