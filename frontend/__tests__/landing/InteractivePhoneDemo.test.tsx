import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InteractivePhoneDemo } from "@/components/landing/InteractivePhoneDemo";

describe("InteractivePhoneDemo Component", () => {
  it("renders Step 1 with service selection by default", () => {
    render(<InteractivePhoneDemo lang="en" />);

    expect(screen.getByText("Need Help Today?")).toBeDefined();
    expect(screen.getByText("AC Chemical Overhaul")).toBeDefined();
    expect(screen.getByText("Continue to Schedule")).toBeDefined();
  });

  it("advances to Step 2 when Continue to Schedule is clicked", () => {
    render(<InteractivePhoneDemo lang="en" />);

    const continueBtn = screen.getByText("Continue to Schedule");
    fireEvent.click(continueBtn);

    expect(screen.getByText("Schedule & Address")).toBeDefined();
    expect(screen.getByText("Dispatch Pro")).toBeDefined();
  });

  it("switches steps when step indicator pills are clicked", () => {
    render(<InteractivePhoneDemo lang="en" />);

    // Click step 3 pill: Live Match
    const matchPill = screen.getByText("Live Match");
    fireEvent.click(matchPill);

    expect(screen.getByText("Certified Pro Assigned!")).toBeDefined();
    expect(screen.getByText("Vireak Sokha")).toBeDefined();
  });

  it("renders a video element when videoUrl is passed", () => {
    const { container } = render(
      <InteractivePhoneDemo lang="en" videoUrl="https://example.com/demo.mp4" />
    );

    const videoEl = container.querySelector("video");
    expect(videoEl).toBeDefined();
    expect(videoEl?.getAttribute("src")).toBe("https://example.com/demo.mp4");
  });
});
