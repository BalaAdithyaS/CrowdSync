import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CrowdBadge } from '../components/locations/CrowdBadge';
import { StatCard } from '../components/admin/StatCard';
import { Button } from '../components/ui/Button';
import { QueueTicketCard } from '../components/queue/QueueTicketCard';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ThemeProvider } from '../context/ThemeContext';
import { resolveWebSocketUrl } from '../lib/websocket';
import { API_BASE } from '../lib/api';
import { Activity } from 'lucide-react';
import type { QueueSession } from '../types';

describe('CrowdBadge component', () => {
  it('renders low crowd badge correctly', () => {
    render(<CrowdBadge level="LOW" />);
    expect(screen.getByText('Low Crowd')).toBeInTheDocument();
  });

  it('renders moderate and high crowd badge labels', () => {
    const { rerender } = render(<CrowdBadge level="MODERATE" />);
    expect(screen.getByText('Moderate')).toBeInTheDocument();

    rerender(<CrowdBadge level="HIGH" />);
    expect(screen.getByText('High Wait')).toBeInTheDocument();
  });
});

describe('StatCard component', () => {
  it('displays title, value, and subtitle', () => {
    render(
      <StatCard
        title="Active Counters"
        value={12}
        subtitle="Across 5 campus hubs"
        icon={Activity}
        variant="cyan"
      />
    );

    expect(screen.getByText('Active Counters')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Across 5 campus hubs')).toBeInTheDocument();
  });
});

describe('Button component', () => {
  it('renders button with text and triggers click events', () => {
    let clicked = false;
    render(
      <Button variant="primary" onClick={() => { clicked = true; }}>
        Take Ticket
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Take Ticket/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(clicked).toBe(true);
  });

  it('disables button when isLoading is set', () => {
    render(
      <Button isLoading>
        Processing
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});

describe('QueueTicketCard component', () => {
  const mockSession: QueueSession = {
    id: 'test-session-1',
    user_id: 'user-student',
    counter_id: 'counter-canteen',
    counter_code: 'A',
    location_id: 'loc-foodcourt',
    ticket_number: 'CEN-A-007',
    sequence_number: 7,
    status: 'WAITING',
    queue_position: 4,
    people_ahead: 3,
    estimated_wait_seconds: 600,
    estimated_wait_range_min: 480,
    estimated_wait_range_max: 720,
    estimation_explanation: 'Based on 12 recent orders at Canteen Express (avg 2.1 mins/person).',
    is_approximate: true,
    joined_at: new Date().toISOString(),
    counter_name: 'Fast Food Pickup',
    location_name: 'Central Campus Food Court',
  };

  it('renders ticket sequence, counter name, and position', () => {
    render(
      <BrowserRouter>
        <QueueTicketCard session={mockSession} />
      </BrowserRouter>
    );

    expect(screen.getByText('CEN-A-007')).toBeInTheDocument();
    expect(screen.getByText('Fast Food Pickup')).toBeInTheDocument();
    expect(screen.getByText('Central Campus Food Court')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument(); // position
  });

  it('displays estimated wait interval', () => {
    render(
      <BrowserRouter>
        <QueueTicketCard session={mockSession} />
      </BrowserRouter>
    );

    expect(screen.getByText(/8[–-]12\s*mins/)).toBeInTheDocument();
  });
});

describe('ThemeToggle celestial component', () => {
  it('toggles theme on click and updates document class', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel={true} />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button');
    expect(toggleBtn).toBeInTheDocument();

    const initialIsDark = document.documentElement.classList.contains('dark');
    fireEvent.click(toggleBtn);

    await waitFor(
      () => {
        expect(document.documentElement.classList.contains('dark')).toBe(!initialIsDark);
      },
      { timeout: 1500 }
    );
  });
});

describe('Deployment URL resolution', () => {
  it('exports a valid API_BASE path', () => {
    expect(API_BASE).toBeDefined();
    expect(typeof API_BASE).toBe('string');
    expect(API_BASE.length).toBeGreaterThan(0);
  });

  it('resolves websocket path with appropriate protocol', () => {
    const wsUrl = resolveWebSocketUrl('/ws/locations/loc-1');
    expect(wsUrl).toMatch(/^wss?:\/\//);
    expect(wsUrl).toContain('/ws/locations/loc-1');
  });
});


