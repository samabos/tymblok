import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import ChangePasswordScreen from '../../app/(auth)/change-password';
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
    changePassword: jest.fn(),
  },
}));

// Mock authStore - required for AuthGuard to render content
jest.mock('../../stores/authStore', () => ({
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

describe('ChangePasswordScreen', () => {
  const mockChangePassword = authService.changePassword as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render change password form', () => {
    render(<ChangePasswordScreen />);

    expect(screen.getByText('Change Password')).toBeTruthy();
    expect(screen.getByText('Current Password')).toBeTruthy();
    expect(screen.getByText('New Password')).toBeTruthy();
    expect(screen.getByText('Confirm New Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your current password')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your new password')).toBeTruthy();
  });

  it('should navigate back when back button is pressed', () => {
    render(<ChangePasswordScreen />);

    // The back button is a TouchableOpacity with arrow-back icon
    // Find it by finding text "Change Password" and getting the parent container
    const headerText = screen.getByText('Change Password');
    const headerView = headerText.parent?.parent;
    const backButton = headerView?.children[0];

    if (backButton) {
      fireEvent.press(backButton);
      expect(router.back).toHaveBeenCalled();
    }
  });

  it('should show password mismatch error', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');

    fireEvent.changeText(newPasswordInput, 'password123');
    fireEvent.changeText(confirmInput, 'differentpassword');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('should not show password mismatch when confirm is empty', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');

    fireEvent.changeText(newPasswordInput, 'password123');

    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  it('should call changePassword when form is valid', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined);

    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'oldpassword123');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('oldpassword123', 'newpassword123');
    });
  });

  it('should show success screen after password change', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined);

    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'oldpassword123');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Password Changed!')).toBeTruthy();
      expect(screen.getByText(/Your password has been successfully updated/)).toBeTruthy();
      expect(screen.getByText('Done')).toBeTruthy();
    });
  });

  it('should navigate back from success screen', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined);

    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'oldpassword123');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeTruthy();
    });

    const doneButton = screen.getByText('Done');
    fireEvent.press(doneButton);

    expect(router.back).toHaveBeenCalled();
  });

  it('should show error when password change fails', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Current password is incorrect'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'wrongpassword');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not submit when new password is less than 8 characters', () => {
    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'oldpassword');
    fireEvent.changeText(newPasswordInput, 'short');
    fireEvent.changeText(confirmInput, 'short');
    fireEvent.press(updateButton);

    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('should not submit when current password is empty', () => {
    render(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('should show loading state while updating', async () => {
    mockChangePassword.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<ChangePasswordScreen />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newPasswordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const updateButton = screen.getByText('Update Password');

    fireEvent.changeText(currentInput, 'oldpassword123');
    fireEvent.changeText(newPasswordInput, 'newpassword123');
    fireEvent.changeText(confirmInput, 'newpassword123');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeTruthy();
    });
  });
});
