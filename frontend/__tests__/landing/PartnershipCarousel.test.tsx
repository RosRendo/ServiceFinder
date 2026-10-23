import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PartnershipCarousel } from "@/components/landing/PartnershipCarousel";

describe("PartnershipCarousel Component", () => {
  it("renders financial rails and developer alliances in English", () => {
    render(<PartnershipCarousel lang="en" />);

    // Strategic Section Header & Badge
    expect(screen.getByText("Strategic Partners & Ecosystem Alliances")).toBeDefined();
    expect(screen.getByText("Trusted by Leading Financial Rails, Developers & Trade Brands")).toBeDefined();

    // Row labels (reused as static band group headings)
    expect(screen.getByText("National Financial Infrastructure & Commercial Banking Rails")).toBeDefined();
    expect(screen.getByText("Premier Property Developers & Industrial Equipment Leaders")).toBeDefined();

    // Partners present exactly once in the static logo band (no marquee duplicates)
    expect(screen.getAllByText("NBC Bakong KHQR")).toHaveLength(1);
    expect(screen.getAllByText("ABA Bank Enterprise")).toHaveLength(1);
    expect(screen.getAllByText("Borey Peng Huoth Group")).toHaveLength(1);
    expect(screen.getAllByText("Daikin Air Conditioning")).toHaveLength(1);
  });

  it("renders in Khmer localization", () => {
    render(<PartnershipCarousel lang="kh" />);

    expect(screen.getByText("ដៃគូសហការ និងបណ្តាញអេកូឡូស៊ី")).toBeDefined();
    expect(screen.getByText("ទំនុកចិត្តពីស្ថាប័នហិរញ្ញវត្ថុ បុរី និងម៉ាកឧបករណ៍ឈានមុខគេ")).toBeDefined();
    expect(screen.getByText("NBC Bakong KHQR")).toBeDefined();
  });

  it("renders a static logo band without filter pills or marquee", () => {
    render(<PartnershipCarousel lang="en" />);

    expect(screen.queryByText("Banking & KHQR Rails")).toBeNull();
    expect(screen.queryByText("Property Developers & Boreys")).toBeNull();
    expect(screen.queryByText("Equipment & HVAC Brands")).toBeNull();

    expect(screen.getByText("Become an Enterprise Partner")).toBeDefined();
  });
});
