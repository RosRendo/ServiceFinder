import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DispatchMapSimulator } from "@/components/landing/DispatchMapSimulator";

describe("DispatchMapSimulator Component", () => {
  it("renders Phnom Penh map and initial active dispatch order", () => {
    render(<DispatchMapSimulator lang="en" />);

    expect(screen.getByText("Phnom Penh Live GPS Dispatch Map")).toBeDefined();
    expect(screen.getByText("WO-8421")).toBeDefined();
    expect(screen.getAllByText("Sokha Vireak").length).toBeGreaterThan(0);
  });

  it("opens Bakong KHQR settlement modal when trigger button is clicked", () => {
    render(<DispatchMapSimulator lang="en" />);

    const khqrBtn = screen.getByRole("button", { name: /View Bakong KHQR/i });
    fireEvent.click(khqrBtn);

    expect(screen.getByText("Instant NBC Settlement")).toBeDefined();
    expect(screen.getByText("$65.00 USD")).toBeDefined();
  });
});
