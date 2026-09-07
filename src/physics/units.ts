export const C = 299_792_458;
export const G = 6.67430e-11;
export const SOLAR_MASS_KG = 1.98847e30;

export function massLengthMetres(solarMasses: number): number {
  return (G * solarMasses * SOLAR_MASS_KG) / (C * C);
}

export function massTimeSeconds(solarMasses: number): number {
  return massLengthMetres(solarMasses) / C;
}

export function schwarzschildRadiusKm(solarMasses: number): number {
  return (2 * massLengthMetres(solarMasses)) / 1000;
}

export function geometricToKm(rOverM: number, solarMasses: number): number {
  return (rOverM * massLengthMetres(solarMasses)) / 1000;
}

export function geometricTimeToSeconds(tOverM: number, solarMasses: number): number {
  return tOverM * massTimeSeconds(solarMasses);
}
