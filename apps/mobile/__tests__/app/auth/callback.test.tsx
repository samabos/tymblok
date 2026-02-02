import { render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import OAuthCallbackScreen from '../../../app/(auth)/callback';
import { useAuthStore } from '../../../stores/authStore';

// Mock @tymblok/ui
jest.mock('@tymblok/ui', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: '#000',
        textMuted: '#666',
        textFaint: '#999',
        bg: '#fff',
      },
    },
  }),
}));

// Mock authStore
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock expo-router (already in jest.setup.js but need to set up useLocalSearchParams)
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

describe('OAuthCallbackScreen', () => {
  const mockSetAuth = jest.fn();
  const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ setAuth: mockSetAuth })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show loading state initially', () => {
    mockUseLocalSearchParams.mockReturnValue({
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    render(<OAuthCallbackScreen />);

    expect(screen.getByText('Completing sign in...')).toBeTruthy();
  });

  it('should store auth and navigate to main app on success', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: '900',
      userId: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
        expect.objectContaining({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 900,
          token_type: 'Bearer',
        })
      );
    });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/today');
    });
  });

  it('should show error and redirect on error param', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      error: 'access_denied',
      errorMessage: 'User denied access',
    });

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Failed')).toBeTruthy();
      expect(screen.getByText('User denied access')).toBeTruthy();
      expect(screen.getByText('Redirecting to login...')).toBeTruthy();
    });

    // Fast-forward timer for redirect
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('should show error when tokens are missing', async () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Failed')).toBeTruthy();
      expect(screen.getByText('Invalid authentication response')).toBeTruthy();
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('should show error when only accessToken is present', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      accessToken: 'token',
    });

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Failed')).toBeTruthy();
      expect(screen.getByText('Invalid authentication response')).toBeTruthy();
    });
  });

  it('should handle missing optional params', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '',
          email: '',
          name: '',
          avatar_url: null,
        }),
        expect.objectContaining({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 900, // Default value
          token_type: 'Bearer',
        })
      );
    });
  });

  it('should show error on auth store failure', async () => {
    mockSetAuth.mockImplementation(() => {
      throw new Error('Storage error');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockUseLocalSearchParams.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    render(<OAuthCallbackScreen />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Failed')).toBeTruthy();
      expect(screen.getByText('Failed to complete authentication')).toBeTruthy();
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    consoleErrorSpy.mockRestore();
  });
});
