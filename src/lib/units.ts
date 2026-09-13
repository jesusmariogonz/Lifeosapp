// Unit conversion helpers.
//
// Canonical DB units (never change regardless of a user's display preference):
//   - weight: kilograms (WellnessLog.weight)
//   - water/liquid: US fluid ounces (WellnessLog.waterOz)
//
// These helpers convert only at the display/input edges (API request/response
// or client UI) — the database always stores the canonical unit.

export type UnitsPreference = "metric" | "imperial";

const KG_PER_LB = 1 / 2.20462; // 1 lb = 0.45359237 kg (2.20462 lb/kg)
const OZ_PER_LITER = 33.814; // 1 L = 33.814 US fl oz

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

// Display weight in the unit the user prefers, given the canonical kg value.
export function weightForDisplay(kg: number, units: UnitsPreference): number {
  return units === "imperial" ? kgToLb(kg) : kg;
}

// Convert a weight value entered in the user's preferred unit back to canonical kg.
export function weightToCanonical(value: number, units: UnitsPreference): number {
  return units === "imperial" ? lbToKg(value) : value;
}

export function ozToLiters(oz: number): number {
  return oz / OZ_PER_LITER;
}

export function litersToOz(liters: number): number {
  return liters * OZ_PER_LITER;
}

// Display water/liquid intake in the user's preferred unit, given the canonical US fl oz value.
// Metric users see liters; imperial users see fl oz (the canonical unit itself).
export function waterForDisplay(oz: number, units: UnitsPreference): number {
  return units === "metric" ? ozToLiters(oz) : oz;
}

// Convert a water value entered in the user's preferred unit back to canonical US fl oz.
export function waterToCanonical(value: number, units: UnitsPreference): number {
  return units === "metric" ? litersToOz(value) : value;
}
