/**
 * KISANOVA — Configurable Business Rules & Parameters for Agricultural Price Engine
 *
 * Rules are explicitly decoupled from code logic to allow administrative adjustment
 * of agricultural premiums, volume tiers, freshness depreciation, and logistics.
 */

export interface PricingEngineConfig {
  qualityMultipliers: Record<string, { multiplier: number; label: string; description: string }>;
  volumeTiers: Array<{
    maxKg: number;
    adjustmentPercent: number;
    tierName: string;
    description: string;
  }>;
  freshnessRules: {
    peakFreshnessDays: number;
    peakFreshnessAdjustment: number;
    shelfLifeDays: Record<string, number>; // perishability by crop
    agingDepreciationDailyPercent: number;
    maxAgingDepreciationPercent: number;
  };
  marketDemandMultipliers: {
    highDemandRfqThreshold: number;
    highDemandAdjustment: number;
    moderateDemandAdjustment: number;
    lowDemandAdjustment: number;
  };
  supplyGlutRules: {
    supplyGlutListingCount: number;
    supplyGlutAdjustment: number;
    supplyDeficitListingCount: number;
    supplyDeficitAdjustment: number;
  };
  logisticsFreightRules: Array<{
    vehicleType: string;
    maxCapacityKg: number;
    baseFare: number;
    perKmPerKgRate: number;
    minPerKgCost: number;
  }>;
}

export const DEFAULT_PRICING_CONFIG: PricingEngineConfig = {
  qualityMultipliers: {
    "Premium Organic": {
      multiplier: 1.22, // +22%
      label: "Premium Organic",
      description: "Certified chemical-free / export quality direct premium (+22%)",
    },
    "Grade A": {
      multiplier: 1.12, // +12%
      label: "Grade A",
      description: "Uniform sizing, zero visible blemishes farm-gate sorted (+12%)",
    },
    "Grade B": {
      multiplier: 1.0, // 0% (Standard Mandi benchmark)
      label: "Grade B",
      description: "Commercial standard grade matching typical mandi arrivals (0%)",
    },
    "Grade C": {
      multiplier: 0.85, // -15%
      label: "Grade C",
      description: "Non-uniform size, processing/cull grade discount (-15%)",
    },
  },

  volumeTiers: [
    {
      maxKg: 150,
      adjustmentPercent: 0.04, // +4%
      tierName: "Direct Consumer / Retail Lot",
      description: "Small lot size commands retail consumer convenience premium (+4%)",
    },
    {
      maxKg: 800,
      adjustmentPercent: 0.0, // 0%
      tierName: "Standard Commercial Lot",
      description: "Standard farm-gate dispatch volume at base market equilibrium (0%)",
    },
    {
      maxKg: 100000,
      adjustmentPercent: -0.05, // -5%
      tierName: "Bulk Institutional Wholesale Lot",
      description: "High volume lot offering volume discount to attract bulk institutional buyers (-5%)",
    },
  ],

  freshnessRules: {
    peakFreshnessDays: 1, // harvested today or tomorrow
    peakFreshnessAdjustment: 0.03, // +3%
    shelfLifeDays: {
      tomato: 4,
      cauliflower: 4,
      cabbage: 6,
      brinjal: 4,
      onion: 45,
      potato: 60,
      rice: 180,
      paddy: 180,
      turmeric: 120,
      default: 5,
    },
    agingDepreciationDailyPercent: 0.03, // -3% per day beyond 2 days for perishables
    maxAgingDepreciationPercent: 0.15, // max -15% discount for old lots
  },

  marketDemandMultipliers: {
    highDemandRfqThreshold: 2, // >= 2 active RFQs
    highDemandAdjustment: 0.05, // +5%
    moderateDemandAdjustment: 0.02, // +2%
    lowDemandAdjustment: 0.0,
  },

  supplyGlutRules: {
    supplyGlutListingCount: 8, // > 8 competing listings in district
    supplyGlutAdjustment: -0.04, // -4%
    supplyDeficitListingCount: 2, // <= 2 competing listings
    supplyDeficitAdjustment: 0.04, // +4%
  },

  logisticsFreightRules: [
    {
      vehicleType: "Mini Tempo (3-Wheeler / Tata Ace)",
      maxCapacityKg: 300,
      baseFare: 120,
      perKmPerKgRate: 0.045, // ₹0.045 / km / kg
      minPerKgCost: 1.5,
    },
    {
      vehicleType: "1.5T Pickup (Mahindra Bolero Maxi)",
      maxCapacityKg: 1500,
      baseFare: 250,
      perKmPerKgRate: 0.033, // ₹0.033 / km / kg
      minPerKgCost: 1.2,
    },
    {
      vehicleType: "Heavy Freight Truck (3.5T - 7T)",
      maxCapacityKg: 100000,
      baseFare: 500,
      perKmPerKgRate: 0.022, // ₹0.022 / km / kg
      minPerKgCost: 0.9,
    },
  ],
};
