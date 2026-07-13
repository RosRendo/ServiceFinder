import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingCancellationModal } from '@/components/booking/BookingCancellationModal';

describe('BookingCancellationModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    isLoading: false,
  };

  it('renders the modal when isOpen is true', () => {
    render(<BookingCancellationModal {...defaultProps} />);
    
    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to cancel this booking/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<BookingCancellationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
  });

  it('calls onClose when "Keep Booking" is clicked', () => {
    render(<BookingCancellationModal {...defaultProps} />);
    
    const keepBookingBtn = screen.getByText('Keep Booking');
    fireEvent.click(keepBookingBtn);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button if no reason is selected', () => {
    render(<BookingCancellationModal {...defaultProps} />);
    
    const confirmBtn = screen.getByText('Confirm Cancellation');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<BookingCancellationModal {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Canceling...')).toBeInTheDocument();
    expect(screen.getByText('Canceling...')).toBeDisabled();
  });
});
