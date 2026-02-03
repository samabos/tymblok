import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailVerificationBanner } from '../../components/EmailVerificationBanner';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

// Mock @tymblok/ui
jest.mock('@tymblok/ui', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: '#000',
        textMuted: '#666',
        bg: '#fff',
      },
    },
  }),
}));

// Mock authService
jest.mock('../../services/authService', () => ({
  authService: {
    resendVerificationEmail: jest.fn(),
  },
}));

// Mock authStore
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('EmailVerificationBanner', () => {
  const mockResendVerificationEmail = authService.resendVerificationEmail as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when user is null', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: null })
    );

    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('should not render when user email is verified', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { email: 'test@example.com', email_verified: true } })
    );

    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('should render when user email is not verified', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'user-123', email: 'test@example.com', email_verified: false } })
    );

    render(<EmailVerificationBanner />);

    expect(screen.getByText('Verify your email')).toBeTruthy();
    expect(screen.getByText(/Please check your inbox/)).toBeTruthy();
    expect(screen.getByText('Resend Email')).toBeTruthy();
  });

  it('should call resendVerificationEmail when button is pressed', async () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'user-123', email: 'test@example.com', email_verified: false } })
    );
    mockResendVerificationEmail.mockResolvedValueOnce(undefined);

    render(<EmailVerificationBanner />);

    const resendButton = screen.getByText('Resend Email');
    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('user-123');
    });
  });

  it('should show success message after email is sent', async () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'user-123', email: 'test@example.com', email_verified: false } })
    );
    mockResendVerificationEmail.mockResolvedValueOnce(undefined);

    render(<EmailVerificationBanner />);

    const resendButton = screen.getByText('Resend Email');
    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Verification email sent!')).toBeTruthy();
    });
  });

  it('should show error message when resend fails', async () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'user-123', email: 'test@example.com', email_verified: false } })
    );
    mockResendVerificationEmail.mockRejectedValueOnce(new Error('Failed to send'));

    render(<EmailVerificationBanner />);

    const resendButton = screen.getByText('Resend Email');
    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send')).toBeTruthy();
    });
  });

  it('should call onDismiss when dismiss button is pressed', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'user-123', email: 'test@example.com', email_verified: false } })
    );
    const mockOnDismiss = jest.fn();

    render(<EmailVerificationBanner onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.press(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });
});
