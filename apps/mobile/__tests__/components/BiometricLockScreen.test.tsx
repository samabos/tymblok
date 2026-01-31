import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BiometricLockScreen } from '../../components/BiometricLockScreen';

describe('BiometricLockScreen', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render locked message', () => {
    render(<BiometricLockScreen biometricType="Face ID" onRetry={mockOnRetry} />);

    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.getByText(/unlock Tymblok/)).toBeTruthy();
  });

  it('should display Face ID biometric type', () => {
    render(<BiometricLockScreen biometricType="Face ID" onRetry={mockOnRetry} />);

    expect(screen.getByText(/Face ID/)).toBeTruthy();
  });

  it('should display Fingerprint biometric type', () => {
    render(<BiometricLockScreen biometricType="Fingerprint" onRetry={mockOnRetry} />);

    expect(screen.getByText(/Fingerprint/)).toBeTruthy();
  });

  it('should show retry button', () => {
    render(<BiometricLockScreen biometricType="Face ID" onRetry={mockOnRetry} />);

    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('should call onRetry when button is pressed', () => {
    render(<BiometricLockScreen biometricType="Face ID" onRetry={mockOnRetry} />);

    fireEvent.press(screen.getByText('Try Again'));

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should render with default biometric type', () => {
    render(<BiometricLockScreen biometricType={null} onRetry={mockOnRetry} />);

    expect(screen.getByText(/biometrics/)).toBeTruthy();
  });
});
