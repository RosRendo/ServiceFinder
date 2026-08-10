import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/components/grid/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders pending status correctly', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders custom/fallback status label if unrecognized', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('hides dot indicator when dot prop is false', () => {
    const { container } = render(<StatusBadge status="pending" dot={false} />);
    const dotElement = container.querySelector('.bg-current');
    expect(dotElement).toBeNull();
  });

  it('shows dot indicator by default', () => {
    const { container } = render(<StatusBadge status="pending" />);
    const dotElement = container.querySelector('.bg-current');
    expect(dotElement).not.toBeNull();
  });
});
