import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LandingPage from "@/app/page";

// Mock AuthContext
vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPage Orchestrator", () => {
  it("renders with default Khmer localization", () => {
    render(<LandingPage />);

    // Verify Brand
    expect(screen.getAllByText("ServiceFinder").length).toBeGreaterThan(0);

    // Verify Khmer Hero text
    expect(screen.getByText(/ជ្រើសរើសជំនាញ/)).toBeDefined();

    // Verify Bakong KHQR presence
    expect(screen.getAllByText(/Bakong KHQR/i).length).toBeGreaterThan(0);
  });

  it("switches to English when language toggle is clicked", () => {
    render(<LandingPage />);

    // Click language toggle button (accessible name from aria-label)
    const langBtn = screen.getByRole("button", { name: /switch language/i });
    fireEvent.click(langBtn);

    // Verify English Hero text
    expect(screen.getByText("Book a trusted Pro.")).toBeDefined();
    expect(screen.getByText("Fixed price, escrow-protected.")).toBeDefined();

    // Verify English ROI calculator section
    expect(screen.getByText("How Much Revenue Can Your Team Generate?")).toBeDefined();
  });
});
