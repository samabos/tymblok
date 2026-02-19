import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import RegisterScreen from '../../../app/(auth)/register';
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
    register: jest.fn(),
    getExternalLoginUrl: jest.fn(
      (provider: string, redirectUrl: string) =>
        `https://api.example.com/auth/external/${provider}?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`
    ),
  },
  mapUserDtoToUser: (dto: Record<string, unknown>) => ({
    id: dto.id,
    email: dto.email,
    name: dto.name,
    avatar_url: dto.avatarUrl,
    email_verified: dto.emailVerified,
    has_password: dto.hasPassword,
    timezone: dto.timezone ?? 'UTC',
    working_hours_start: dto.workingHoursStart ?? '09:00',
    working_hours_end: dto.workingHoursEnd ?? '18:00',
    lunch_start: dto.lunchStart ?? '12:00',
    lunch_duration_minutes: dto.lunchDurationMinutes ?? 60,
    notification_block_reminder: dto.notificationBlockReminder ?? true,
    notification_reminder_minutes: dto.notificationReminderMinutes ?? 5,
    notification_daily_summary: dto.notificationDailySummary ?? true,
    created_at: dto.createdAt,
    updated_at: dto.createdAt,
  }),
  OAuthProvider: {},
}));

// Mock authStore
jest.mock('../../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('RegisterScreen', () => {
  const mockSetAuth = jest.fn();
  const mockRegister = authService.register as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockSetAuth);
  });

  it('should render registration form elements', () => {
    render(<RegisterScreen />);

    expect(screen.getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Join Tymblok today')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText('Confirm Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Firstname Lastname')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
    expect(screen.getByText('Must be at least 8 characters')).toBeTruthy();
    expect(screen.getByText('Already have an account? ')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByTestId('tymblok-logo')).toBeTruthy();
  });

  it('should not submit when fields are empty', () => {
    render(<RegisterScreen />);

    // Find the button text and press it
    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should show password mismatch error when passwords do not match', () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'differentpassword');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('should not show password mismatch error when confirm password is empty', () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');

    fireEvent.changeText(passwordInput, 'password123');

    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  it('should not submit when passwords do not match', () => {
    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'differentpassword');

    // Find the button text and press it
    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call authService.register on valid form submit', async () => {
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
    mockRegister.mockResolvedValueOnce(mockResponse);

    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    // Find the button text and press it
    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });
  });

  it('should call setAuth and navigate on successful registration', async () => {
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
    mockRegister.mockResolvedValueOnce(mockResponse);

    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

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

  it('should show loading state while registering', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeTruthy();
    });
  });

  it('should handle registration error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRegister.mockRejectedValueOnce(new Error('Email already exists'));

    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'existing@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Register]', 'Email already exists');
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not submit when password is less than 8 characters', () => {
    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'short');
    fireEvent.changeText(confirmInput, 'short');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should not submit when name is only whitespace', () => {
    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, '   ');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should disable inputs while loading', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

    render(<RegisterScreen />);

    const nameInput = screen.getByPlaceholderText('Firstname Lastname');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'password123');

    const buttons = screen.getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Firstname Lastname').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('you@example.com').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('At least 8 characters').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('Re-enter your password').props.editable).toBe(false);
    });
  });

  describe('OAuth buttons', () => {
    it('should render OAuth buttons', () => {
      render(<RegisterScreen />);

      expect(screen.getByText('Sign up with Google')).toBeTruthy();
      expect(screen.getByText('Sign up with GitHub')).toBeTruthy();
      expect(screen.getByText('or sign up with email')).toBeTruthy();
    });

    it('should open Google OAuth when Google button is pressed', async () => {
      const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;
      mockOpenAuthSession.mockResolvedValueOnce({ type: 'success' });

      render(<RegisterScreen />);

      const googleButton = screen.getByText('Sign up with Google');
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

      render(<RegisterScreen />);

      const githubButton = screen.getByText('Sign up with GitHub');
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
