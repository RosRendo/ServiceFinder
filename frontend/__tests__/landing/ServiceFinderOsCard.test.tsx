import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ServiceFinderOsCard } from "@/components/landing/ServiceFinderOsCard";

describe("ServiceFinderOsCard Component", () => {
  it("renders 2 visible stacked booking cards with 1st clear and 2nd faded", () => {
    render(<ServiceFinderOsCard lang="en" />);

    expect(screen.getByText("SF-8421")).toBeDefined();
    expect(screen.getByText("SF-8422")).toBeDefined();
    expect(screen.getAllByText("Vireak S.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rithy P.").length).toBeGreaterThan(0);
  });

  it("advances the loop upwards when timer ticks", () => {
    vi.useFakeTimers();
    render(<ServiceFinderOsCard lang="en" />);

    // Initial check: SF-8421, SF-8422
    expect(screen.getByText("SF-8421")).toBeDefined();

    // Advance timer past 1 cycle (2800ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Now the stack shifts: SF-8422 becomes spotlight, SF-8423 enters behind
    expect(screen.getByText("SF-8423")).toBeDefined();

    vi.useRealTimers();
  });

  it("renders Khmer localized service titles when lang='kh'", () => {
    render(<ServiceFinderOsCard lang="kh" />);

    expect(screen.getByText("សេវាលាងសម្អាតម៉ាស៊ីនត្រជាក់គីមី")).toBeDefined();
  });
});
