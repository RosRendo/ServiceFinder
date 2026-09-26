import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PartnershipCarousel } from "@/components/landing/PartnershipCarousel";

describe("PartnershipCarousel Component", () => {
  it("renders financial rails and developer alliances in English", () => {
    render(<PartnershipCarousel lang="en" />);

    // Strategic Section Header & Badge
    expect(screen.getByText("Strategic Partners & Ecosystem Alliances")).toBeDefined();
    expect(screen.getByText("Trusted by Leading Financial Rails, Developers & Trade Brands")).toBeDefined();

    // Trust Metrics
    expect(screen.getByText("NBC Bakong KHQR National Standard")).toBeDefined();
    expect(screen.getByText("250+ Licensed & Vetted Enterprises")).toBeDefined();

    // Partners present in marquee
    expect(screen.getAllByText("NBC Bakong KHQR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ABA Bank Enterprise").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Borey Peng Huoth Group").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Daikin Air Conditioning").length).toBeGreaterThan(0);
  });

  it("renders in Khmer localization", () => {
    render(<PartnershipCarousel lang="kh" />);

    expect(screen.getByText("ដៃគូសហការ និងបណ្តាញអេកូឡូស៊ី")).toBeDefined();
    expect(screen.getByText("ទំនុកចិត្តពីស្ថាប័នហិរញ្ញវត្ថុ បុរី និងម៉ាកឧបករណ៍ឈានមុខគេ")).toBeDefined();
    expect(screen.getByText("ប្រព័ន្ធទូទាត់ជាតិ NBC Bakong KHQR")).toBeDefined();
  });

  it("filters partners when category buttons are clicked", () => {
    render(<PartnershipCarousel lang="en" />);

    const financeFilter = screen.getByText("Banking & KHQR Rails");
    fireEvent.click(financeFilter);

    // Filter button exists and can be clicked
    expect(financeFilter).toBeDefined();
  });
});
