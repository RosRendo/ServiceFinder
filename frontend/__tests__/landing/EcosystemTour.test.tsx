import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EcosystemTour } from "@/components/landing/EcosystemTour";

describe("EcosystemTour Component", () => {
  it("renders with default company dispatcher view", () => {
    render(<EcosystemTour lang="en" />);

    expect(screen.getByText("Enterprise Dispatching OS")).toBeDefined();
    expect(screen.getByText("3-Click Smart Dispatch & Profit Analytics")).toBeDefined();
  });

  it("switches to customer persona on tab click", () => {
    render(<EcosystemTour lang="en" />);

    const customerTab = screen.getByText("1. Customer (Mobile)");
    fireEvent.click(customerTab);

    expect(screen.getByText("Mobile Client Experience")).toBeDefined();
    expect(screen.getByText("30-Second Booking & Live Staff Tracking")).toBeDefined();
  });

  it("switches to staff persona on tab click", () => {
    render(<EcosystemTour lang="en" />);

    const staffTab = screen.getByText("3. Field Tech (Mobile GPS)");
    fireEvent.click(staffTab);

    expect(screen.getByText("Field Staff Companion")).toBeDefined();
    expect(screen.getByText("Instant Job Alerts & Turn-by-Turn Navigation")).toBeDefined();
  });
});
