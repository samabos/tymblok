import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from '../../components/LoadingScreen';

describe('LoadingScreen', () => {
  it('should render loading indicator', () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should render app name', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Tymblok')).toBeTruthy();
  });
});
