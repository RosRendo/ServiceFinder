import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StaffTechSimulator } from "@/components/landing/StaffTechSimulator";

describe("StaffTechSimulator Component", () => {
  it("renders Step 1 with new work order alert by default", () => {
    render(<StaffTechSimulator lang="en" />);

    expect(screen.getByText("New Work Order Alert")).toBeDefined();
    expect(screen.getByText("AC Chemical Overhaul")).toBeDefined();
    expect(screen.getByText("Tap to Accept Work Order")).toBeDefined();
  });

  it("advances to Step 2 when Tap to Accept is clicked", () => {
    render(<StaffTechSimulator lang="en" />);

    const acceptBtn = screen.getByText("Tap to Accept Work Order");
    fireEvent.click(acceptBtn);

    expect(screen.getByText("On-Site Work in Progress")).toBeDefined();
    expect(screen.getByText("Complete & Collect $35.00")).toBeDefined();
  });

  it("advances to Step 3 when Complete & Collect is clicked", () => {
    render(<StaffTechSimulator lang="en" />);

    // Jump to step 2 then step 3
    fireEvent.click(screen.getByText("Tap to Accept Work Order"));
    fireEvent.click(screen.getByText("Complete & Collect $35.00"));

    expect(screen.getByText("Job Completed & Settled")).toBeDefined();
    expect(screen.getByText("+$35.00")).toBeDefined();
  });

  it("switches steps when step indicator pills are clicked", () => {
    render(<StaffTechSimulator lang="en" />);

    const payoutPill = screen.getByText("3. Payout");
    fireEvent.click(payoutPill);

    expect(screen.getByText("Job Completed & Settled")).toBeDefined();
  });
});
