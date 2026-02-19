import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ResetPasswordScreen from '../../../app/reset-password';
import { authService } from '../../../services/authService';

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
      },
    },
  }),
}));

// Mock authService
jest.mock('../../../services/authService', () => ({
  authService: {
    resetPassword: jest.fn(),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

describe('ResetPasswordScreen', () => {
  const mockResetPassword = authService.resetPassword as jest.Mock;
  const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show invalid link message when no token', () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<ResetPasswordScreen />);

    expect(screen.getByText('Invalid Reset Link')).toBeTruthy();
    expect(screen.getByText(/This password reset link is invalid/)).toBeTruthy();
    expect(screen.getByText('Back to Login')).toBeTruthy();
  });

  it('should navigate to login when clicking Back to Login on invalid link', () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<ResetPasswordScreen />);

    const backButton = screen.getByText('Back to Login');
    fireEvent.press(backButton);

    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should show password form when token is present', () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });

    render(<ResetPasswordScreen />);

    expect(screen.getByText('Set New Password')).toBeTruthy();
    expect(screen.getByText('New Password')).toBeTruthy();
    expect(screen.getByText('Confirm Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('should show password mismatch error', () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmInput, 'differentpassword');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('should not show password mismatch error when confirm is empty', () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');

    fireEvent.changeText(passwordInput, 'password123');

    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  it('should call resetPassword when form is valid', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });
    mockResetPassword.mockResolvedValueOnce(undefined);

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'valid-token',
        'newpassword123'
      );
    });
  });

  it('should show success screen after password reset', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });
    mockResetPassword.mockResolvedValueOnce(undefined);

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Password Reset!')).toBeTruthy();
      expect(screen.getByText(/Your password has been successfully reset/)).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
    });
  });

  it('should navigate to login from success screen', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });
    mockResetPassword.mockResolvedValueOnce(undefined);

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeTruthy();
    });

    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);

    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should show error when reset fails', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });
    mockResetPassword.mockRejectedValueOnce(new Error('Token expired'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not submit when password is less than 8 characters', () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'short');
    fireEvent.changeText(confirmInput, 'short');
    fireEvent.press(resetButton);

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should show loading state while resetting', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'valid-token', email: 'test@example.com' });
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ResetPasswordScreen />);

    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const resetButton = screen.getByText('Reset Password');

    fireEvent.changeText(passwordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Resetting...')).toBeTruthy();
    });
  });
});
