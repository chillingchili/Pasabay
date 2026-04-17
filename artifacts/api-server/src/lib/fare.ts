export const MATCHING_FEE_PHP = 8;
export const DEFAULT_FUEL_EFFICIENCY_KM_PER_L = 20;
export const DEFAULT_FUEL_PRICE_PHP_PER_L = 65;

export interface PassengerFareInput {
  passengerDistanceKm: number;
  allPassengerDistancesKm: number[];
  totalRouteDistanceKm: number;
  fuelPricePhp?: number;
  fuelEfficiencyKmPerL?: number;
}

export function calculatePassengerFare(input: PassengerFareInput): {
  fare: number;
  matchingFee: number;
  total: number;
  breakdown: {
    fuelShare: number;
    passengerShare: number;
    totalRouteDistanceKm: number;
  };
} {
  const {
    passengerDistanceKm,
    allPassengerDistancesKm,
    totalRouteDistanceKm,
    fuelPricePhp = DEFAULT_FUEL_PRICE_PHP_PER_L,
    fuelEfficiencyKmPerL = DEFAULT_FUEL_EFFICIENCY_KM_PER_L,
  } = input;

  const sumPassengerDistances = allPassengerDistancesKm.reduce((a, b) => a + b, 0);
  const passengerShare = sumPassengerDistances === 0 ? 1 : passengerDistanceKm / sumPassengerDistances;

  const totalFuelCost = (totalRouteDistanceKm * fuelPricePhp) / fuelEfficiencyKmPerL;
  const fare = Math.round(passengerShare * totalFuelCost * 100) / 100;
  const total = fare + MATCHING_FEE_PHP;

  return {
    fare,
    matchingFee: MATCHING_FEE_PHP,
    total,
    breakdown: {
      fuelShare: totalFuelCost,
      passengerShare,
      totalRouteDistanceKm,
    },
  };
}

export function validateFuelEfficiency(
  driverInput: number,
  make: string,
  year: number
): { valid: boolean; approved: number } {
  const BASE_EFFICIENCY = 20;
  const TOLERANCE = 0.35;

  const estimatedEfficiency = estimateVehicleEfficiency(make, year);
  const low = estimatedEfficiency * (1 - TOLERANCE);
  const high = estimatedEfficiency * (1 + TOLERANCE);

  if (driverInput >= low && driverInput <= high) {
    return { valid: true, approved: driverInput };
  }
  return { valid: false, approved: estimatedEfficiency };
}

function estimateVehicleEfficiency(make: string, year: number): number {
  const m = make.toLowerCase();
  const age = new Date().getFullYear() - year;

  let base = 14;
  if (m.includes("toyota") || m.includes("honda")) base = 18;
  else if (m.includes("mitsubishi") || m.includes("suzuki")) base = 17;
  else if (m.includes("isuzu")) base = 12;
  else if (m.includes("ford") || m.includes("chevrolet")) base = 13;

  const agePenalty = Math.min(age * 0.2, 4);
  return Math.max(base - agePenalty, 8);
}
