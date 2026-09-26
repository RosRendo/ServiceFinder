import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeforeAfterScrubber } from "@/components/landing/BeforeAfterScrubber";

describe("BeforeAfterScrubber Component", () => {
  it("renders before and after images with appropriate labels", () => {
    render(
      <BeforeAfterScrubber
        beforeImage="/images/before.jpg"
        afterImage="/images/after.jpg"
        beforeLabel="Dusty Coil"
        afterLabel="Cleaned Coil"
      />
    );

    expect(screen.getByText("Dusty Coil")).toBeDefined();
    expect(screen.getByText("Cleaned Coil")).toBeDefined();
    expect(screen.getByText("↔ Drag to compare")).toBeDefined();
  });
});
