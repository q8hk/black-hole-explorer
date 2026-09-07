import { C, G, SOLAR_MASS_KG, massLengthMetres } from './units';

export const photonSphereRadius = (mass = 1): number => 3 * mass;
export const schwarzschildISCO = (mass = 1): number => 6 * mass;
export const criticalImpactParameter = (mass = 1): number => 3 * Math.sqrt(3) * mass;

export function stationaryTimeDilation(rOverM: number): number {
  if (rOverM <= 2) return Number.NaN;
  return Math.sqrt(1 - 2 / rOverM);
}

export function stationaryGravitationalRedshiftToInfinity(rOverM: number): number {
  return 1 / stationaryTimeDilation(rOverM) - 1;
}

export function staticObserverShadowHalfAngle(rOverM: number): number {
  if (rOverM <= 2) return Number.NaN;
  const sin = (3 * Math.sqrt(3) / rOverM) * Math.sqrt(1 - 2 / rOverM);
  return Math.asin(Math.min(1, sin));
}

export function weakFieldDeflection(bOverM: number): number {
  return 4 / bOverM;
}

/** Radial stretching eigenvalue magnitude, converted to differential acceleration over length. */
export function radialTidalAcceleration(
  solarMasses: number,
  rOverM: number,
  lengthMetres = 1.8,
): number {
  const massKg = solarMasses * SOLAR_MASS_KG;
  const rMetres = rOverM * massLengthMetres(solarMasses);
  return (2 * G * massKg * lengthMetres) / (rMetres ** 3);
}

export function transverseTidalAcceleration(
  solarMasses: number,
  rOverM: number,
  lengthMetres = 1.8,
): number {
  return -radialTidalAcceleration(solarMasses, rOverM, lengthMetres) / 2;
}

export function properHoverAcceleration(solarMasses: number, rOverM: number): number {
  if (rOverM <= 2) return Number.POSITIVE_INFINITY;
  const r = rOverM * massLengthMetres(solarMasses);
  const mass = solarMasses * SOLAR_MASS_KG;
  return (G * mass) / (r * r * Math.sqrt(1 - 2 / rOverM));
}

export const cFraction = (speed: number): number => speed / C;
