import { describe, it, expect } from "vitest";
import { computePartnerRoi } from "@/components/landing/PartnerRoiCalculator";

describe("PartnerRoiCalculator Logic", () => {
  it("computes accurate baseline projections for 5 technicians", () => {
    const result = computePartnerRoi({
      teamSize: 5,
      averageTicketUsd: 45.0,
      jobsPerDayPerTech: 3.5,
      workDaysPerMonth: 26,
    });

    // 5 * 3.5 * 26 = 455 jobs
    expect(result.monthlyJobCapacity).toBe(455);
    // 455 * $45 = $20,475
    expect(result.monthlyGrossRevenue).toBe(20475);
    // 20475 * 0.35 = 7166.25 -> 7166
    expect(result.estimatedNetGrowth).toBe(7166);
    // 7166 * 12 = 85992
    expect(result.annualRevenueUplift).toBe(85992);
    // 5 * 18 = 90
    expect(result.timeSavedHoursPerMonth).toBe(90);
  });

  it("handles scale boundary of 1 technician (solo contractor)", () => {
    const result = computePartnerRoi({
      teamSize: 1,
      averageTicketUsd: 45.0,
      jobsPerDayPerTech: 3.5,
      workDaysPerMonth: 26,
    });

    // 1 * 3.5 * 26 = 91 jobs
    expect(result.monthlyJobCapacity).toBe(91);
    // 91 * $45 = $4,095
    expect(result.monthlyGrossRevenue).toBe(4095);
    // 4095 * 0.35 = 1433.25 -> 1433
    expect(result.estimatedNetGrowth).toBe(1433);
  });

  it("handles maximum enterprise team size of 50 technicians", () => {
    const result = computePartnerRoi({
      teamSize: 50,
      averageTicketUsd: 45.0,
      jobsPerDayPerTech: 3.5,
      workDaysPerMonth: 26,
    });

    // 50 * 3.5 * 26 = 4550 jobs
    expect(result.monthlyJobCapacity).toBe(4550);
    // 4550 * $45 = $204,750
    expect(result.monthlyGrossRevenue).toBe(204750);
    // 204750 * 0.35 = 71662.5 -> 71663
    expect(result.estimatedNetGrowth).toBe(71663);
    expect(result.annualRevenueUplift).toBe(71663 * 12);
  });
});
