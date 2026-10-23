import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EcosystemTour } from "@/components/landing/EcosystemTour";

describe("EcosystemTour Component", () => {
  it("renders the customer persona by default", () => {
    render(<EcosystemTour lang="en" />);

    expect(screen.getByText("Mobile Client Experience")).toBeDefined();
    expect(screen.getByText("30-Second Booking & Live Staff Tracking")).toBeDefined();
  });

  it("switches to company persona on tab click", () => {
    render(<EcosystemTour lang="en" />);

    fireEvent.click(screen.getByText("2. Company Admin (Web OS)"));

    expect(screen.getByText("Enterprise Dispatching OS")).toBeDefined();
    expect(screen.getByText("3-Click Smart Dispatch & Profit Analytics")).toBeDefined();
  });

  it("switches to staff persona on tab click", () => {
    render(<EcosystemTour lang="en" />);

    fireEvent.click(screen.getByText("3. Field Tech (Mobile GPS)"));

    expect(screen.getByText("Field Staff Companion")).toBeDefined();
    expect(screen.getByText("Instant Job Alerts & Turn-by-Turn Navigation")).toBeDefined();
  });

  it("advances the customer simulator step automatically every 3s", () => {
    vi.useFakeTimers();
    render(<EcosystemTour lang="en" />);

    expect(screen.getByText("Need Help Today?")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Schedule & Address")).toBeDefined();

    vi.useRealTimers();
  });

  it("stops autoplay after a manual step selection", () => {
    vi.useFakeTimers();
    render(<EcosystemTour lang="en" />);

    fireEvent.click(screen.getByText("Bakong KHQR"));

    expect(screen.getByText("Instant Escrow Lock")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByText("Instant Escrow Lock")).toBeDefined();

    vi.useRealTimers();
  });
});
