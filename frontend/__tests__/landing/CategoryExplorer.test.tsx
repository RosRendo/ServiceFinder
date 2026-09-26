import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryExplorer } from "@/components/landing/CategoryExplorer";

describe("CategoryExplorer Component", () => {
  it("renders all top trade categories in English", () => {
    render(<CategoryExplorer lang="en" />);

    expect(screen.getByText("Air Conditioning & HVAC")).toBeDefined();
    expect(screen.getByText("Electrical & Wiring")).toBeDefined();
    expect(screen.getByText("Plumbing & Drainage")).toBeDefined();
    expect(screen.getByText("Deep Home & Office Cleaning")).toBeDefined();
  });

  it("renders all top trade categories in Khmer", () => {
    render(<CategoryExplorer lang="kh" />);

    expect(screen.getByText("សេវាកម្មម៉ាស៊ីនត្រជាក់")).toBeDefined();
    expect(screen.getByText("សេវាកម្មប្រព័ន្ធអគ្គិសនី")).toBeDefined();
    expect(screen.getByText("សេវាកម្មជួសជុលទុយោទឹក")).toBeDefined();
  });
});
