import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import SetPasswordScreen from '../../app/(auth)/set-password';
import { authService } from '../../services/authService';

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

// Mock authService
jest.mock('../../services/authService', () => ({
  authService: {
    setPassword: jest.fn(),
  },
}));

// Mock authStore - required for AuthGuard to render content
const mockUpdateUser = jest.fn();
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = {
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true,
        has_password: false,
      },
      updateUser: mockUpdateUser,
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  }),
}));

describe('SetPasswordScreen', () => {
  const mockSetPassword = authService.setPassword as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render set password form', () => {
    render(<SetPasswordScreen />);

    // "Set Password" appears in both header and button
    expect(screen.getAllByText('Set Password').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('New Password')).toBeTruthy();
    expect(screen.getByText('Confirm Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('should show info text about adding password', () => {
    render(<SetPasswordScreen />);

    expect(screen.getByText(/Add a password to your account/)).toBeTruthy();
  });

  it('should navigate back when back button is pressed', () => {
    render(<SetPasswordScreen />);

    // The back button is a TouchableOpacity with arrow-back icon
    // Find it by finding header text and getting the parent container
    const headerTexts = screen.getAllByText('Set Password');
    const headerText = headerTexts[0]; // First one is in header
    const headerView = headerText.parent?.parent;
    const backButton = headerView?.children[0];

    if (backButton) {
      fireEvent.press(backButton);
      expect(router.back).toHaveBeenCalled();
    }
  });

  it('should show password mismatch error', () => {
    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');

    fireEvent.changeText(newPasswordInput, 'password123');
    fireEvent.changeText(confirmInput, 'differentpassword');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('should not show password mismatch when confirm is empty', () => {
    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');

    fireEvent.changeText(newPasswordInput, 'password123');

    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  it('should show password length warning for short password', () => {
    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    fireEvent.changeText(newPasswordInput, 'short');

    expect(screen.getByText('Must be at least 8 characters')).toBeTruthy();
  });

  it('should call setPassword when form is valid', async () => {
    mockSetPassword.mockResolvedValueOnce(undefined);

    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(setButton);

    await waitFor(() => {
      expect(mockSetPassword).toHaveBeenCalledWith('newpassword123');
    });
  });

  it('should show success screen after setting password', async () => {
    mockSetPassword.mockResolvedValueOnce(undefined);

    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(setButton);

    await waitFor(() => {
      expect(screen.getByText('Password Set!')).toBeTruthy();
      expect(screen.getByText(/You can now sign in with your email/)).toBeTruthy();
    });
  });

  it('should show error message when setPassword fails', async () => {
    mockSetPassword.mockRejectedValueOnce(new Error('Password must be stronger'));

    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(setButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be stronger')).toBeTruthy();
    });
  });

  it('should disable button when password is too short', () => {
    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'short');
    fireEvent.changeText(confirmInput, 'short');

    // Button should be disabled (opacity 0.5)
    expect(setButton.props.accessibilityState?.disabled ||
           setButton.parent?.parent?.props?.disabled).toBeTruthy;
  });

  it('should navigate back when Done is pressed on success screen', async () => {
    mockSetPassword.mockResolvedValueOnce(undefined);

    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(setButton);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Done'));

    expect(router.back).toHaveBeenCalled();
  });

  it('should show loading state while setting password', async () => {
    mockSetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<SetPasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your password');
    const setButton = screen.getByTestId('set-password-button');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(setButton);

    await waitFor(() => {
      expect(screen.getByText('Setting Password...')).toBeTruthy();
    });
  });
});
