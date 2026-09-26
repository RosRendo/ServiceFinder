import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusPill } from '@/components/admin/StatusPill';
import { EmptyState } from '@/components/admin/EmptyState';
import { getSemanticStatusCategory } from '@/lib/management-tokens';

describe('StatusPill Component', () => {
  it('maps success statuses to success semantic category', () => {
    expect(getSemanticStatusCategory('active')).toBe('success');
    expect(getSemanticStatusCategory('verified')).toBe('success');
    expect(getSemanticStatusCategory('completed')).toBe('success');
    expect(getSemanticStatusCategory('paid')).toBe('success');
  });

  it('maps warning statuses to warning semantic category', () => {
    expect(getSemanticStatusCategory('pending')).toBe('warning');
    expect(getSemanticStatusCategory('under_review')).toBe('warning');
    expect(getSemanticStatusCategory('dispatched')).toBe('warning');
  });

  it('maps critical statuses to critical semantic category', () => {
    expect(getSemanticStatusCategory('rejected')).toBe('critical');
    expect(getSemanticStatusCategory('suspended')).toBe('critical');
    expect(getSemanticStatusCategory('cancelled')).toBe('critical');
    expect(getSemanticStatusCategory('failed')).toBe('critical');
  });

  it('maps info statuses to info semantic category', () => {
    expect(getSemanticStatusCategory('in_progress')).toBe('info');
    expect(getSemanticStatusCategory('assigned')).toBe('info');
    expect(getSemanticStatusCategory('processing')).toBe('info');
  });

  it('renders status text cleanly formatted', () => {
    render(<StatusPill status="pending_verification" />);
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<StatusPill status="verified" label="Authorized Partner" />);
    expect(screen.getByText('Authorized Partner')).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('renders default empty state text', () => {
    render(<EmptyState title="No records found" description="Nothing matches search." />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
    expect(screen.getByText('Nothing matches search.')).toBeInTheDocument();
  });

  it('renders action button and triggers callback', () => {
    let clicked = false;
    render(
      <EmptyState
        title="Empty List"
        actionLabel="Create Item"
        onActionClick={() => { clicked = true; }}
      />
    );
    const btn = screen.getByText('Create Item');
    btn.click();
    expect(clicked).toBe(true);
  });
});
