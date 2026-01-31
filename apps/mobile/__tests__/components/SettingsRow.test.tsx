import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SettingsRow } from '../../components/SettingsRow';

describe('SettingsRow', () => {
  it('should render label text', () => {
    render(<SettingsRow label="Test Label" />);

    expect(screen.getByText('Test Label')).toBeTruthy();
  });

  it('should render subtitle when provided', () => {
    render(<SettingsRow label="Test" subtitle="Test subtitle" />);

    expect(screen.getByText('Test subtitle')).toBeTruthy();
  });

  it('should not render subtitle when not provided', () => {
    render(<SettingsRow label="Test" />);

    expect(screen.queryByText('Test subtitle')).toBeNull();
  });

  it('should call onPress when row is pressed', () => {
    const mockOnPress = jest.fn();
    render(<SettingsRow label="Test" onPress={mockOnPress} />);

    fireEvent.press(screen.getByText('Test'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render switch when showSwitch is true', () => {
    render(<SettingsRow label="Test" showSwitch value={false} onValueChange={() => {}} />);

    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('should call onValueChange when switch is toggled', () => {
    const mockOnValueChange = jest.fn();
    render(<SettingsRow label="Test" showSwitch value={false} onValueChange={mockOnValueChange} />);

    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(mockOnValueChange).toHaveBeenCalledWith(true);
  });

  it('should disable switch when disabled prop is true', () => {
    render(
      <SettingsRow label="Test" showSwitch value={false} onValueChange={() => {}} disabled />
    );

    const switchComponent = screen.getByRole('switch');
    expect(switchComponent.props.disabled).toBe(true);
  });

  it('should render chevron when showSwitch is false and onPress is provided', () => {
    render(<SettingsRow label="Test" onPress={() => {}} />);

    expect(screen.getByTestId('chevron-icon')).toBeTruthy();
  });
});
