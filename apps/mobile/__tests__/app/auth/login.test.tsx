import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import LoginScreen from '../../../app/(auth)/login';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../stores/authStore';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `tymblok://${path}`),
  parse: jest.fn(),
}));

// Mock authService
jest.mock('../../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    getExternalLoginUrl: jest.fn((provider: string, redirectUrl: string) =>
      `https://api.example.com/auth/external/${provider}?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`
    ),
  },
}));

// Mock authStore
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('LoginScreen', () => {
  const mockSetAuth = jest.fn();
  const mockLogin = authService.login as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockSetAuth);
  });

  it('should render login form elements', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Tymblok')).toBeTruthy();
    expect(screen.getByText('Time blocking for developers')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@company.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText("Don't have an account? ")).toBeTruthy();
    expect(screen.getByText('Sign Up')).toBeTruthy();
    expect(screen.getByTestId('tymblok-logo')).toBeTruthy();
  });

  it('should not submit when fields are empty', () => {
    render(<LoginScreen />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.press(signInButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should not submit when only email is filled', () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    fireEvent.changeText(emailInput, 'test@example.com');

    const signInButton = screen.getByText('Sign in');
    fireEvent.press(signInButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call authService.login on form submit', async () => {
    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };
    mockLogin.mockResolvedValueOnce(mockResponse);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should call setAuth and navigate on successful login', async () => {
    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        emailVerified: true,
        hasPassword: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };
    mockLogin.mockResolvedValueOnce(mockResponse);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        }),
        expect.objectContaining({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        })
      );
    });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/today');
    });
  });

  it('should show loading state while signing in', async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeTruthy();
    });
  });

  it('should handle login error gracefully', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });

    // Button should be back to normal state after error
    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeTruthy();
    });
  });

  it('should not submit when email is only whitespace', () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.changeText(emailInput, '   ');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  describe('OAuth buttons', () => {
    it('should render OAuth buttons', () => {
      render(<LoginScreen />);

      expect(screen.getByText('Google')).toBeTruthy();
      expect(screen.getByText('GitHub')).toBeTruthy();
      expect(screen.getByText('or continue with')).toBeTruthy();
    });

    it('should open Google OAuth when Google button is pressed', async () => {
      const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;
      mockOpenAuthSession.mockResolvedValueOnce({ type: 'success' });

      render(<LoginScreen />);

      const googleButton = screen.getByText('Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockOpenAuthSession).toHaveBeenCalledWith(
          expect.stringContaining('/auth/external/google'),
          'tymblok://callback'
        );
      });
    });

    it('should open GitHub OAuth when GitHub button is pressed', async () => {
      const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;
      mockOpenAuthSession.mockResolvedValueOnce({ type: 'success' });

      render(<LoginScreen />);

      const githubButton = screen.getByText('GitHub');
      fireEvent.press(githubButton);

      await waitFor(() => {
        expect(mockOpenAuthSession).toHaveBeenCalledWith(
          expect.stringContaining('/auth/external/github'),
          'tymblok://callback'
        );
      });
    });
  });
});
