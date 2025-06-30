import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CardPreview } from '../card-preview';

describe('CardPreview', () => {
  it('renders children correctly', () => {
    render(
      <CardPreview imageUrl="test.jpg" cardName="Test Card">
        <span>Card Name</span>
      </CardPreview>
    );
    
    expect(screen.getByText('Card Name')).toBeInTheDocument();
  });

  it('shows preview on hover after delay', async () => {
    vi.useFakeTimers();
    
    render(
      <CardPreview imageUrl="test.jpg" cardName="Test Card">
        <span>Card Name</span>
      </CardPreview>
    );
    
    const element = screen.getByText('Card Name');
    
    // Initially no preview
    expect(screen.queryByAltText('Test Card')).not.toBeInTheDocument();
    
    // Hover over element
    fireEvent.mouseEnter(element);
    
    // Advance timers by 300ms
    vi.advanceTimersByTime(300);
    
    // Preview should appear
    await waitFor(() => {
      expect(screen.getByAltText('Test Card')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('does not show preview without imageUrl', async () => {
    vi.useFakeTimers();
    
    render(
      <CardPreview imageUrl={undefined} cardName="Test Card">
        <span>Card Name</span>
      </CardPreview>
    );
    
    const element = screen.getByText('Card Name');
    fireEvent.mouseEnter(element);
    vi.advanceTimersByTime(300);
    
    expect(screen.queryByAltText('Test Card')).not.toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('hides preview on mouse leave', async () => {
    vi.useFakeTimers();
    
    render(
      <CardPreview imageUrl="test.jpg" cardName="Test Card">
        <span>Card Name</span>
      </CardPreview>
    );
    
    const element = screen.getByText('Card Name');
    
    // Show preview
    fireEvent.mouseEnter(element);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByAltText('Test Card')).toBeInTheDocument();
    });
    
    // Hide preview
    fireEvent.mouseLeave(element);
    
    expect(screen.queryByAltText('Test Card')).not.toBeInTheDocument();
    
    vi.useRealTimers();
  });
});