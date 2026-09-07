/** Proper time for radial fall from rest at infinity from r0 to r1, in units of M. */
export function radialInfallProperTime(r0: number, r1: number, mass = 1): number {
  if (r0 < r1 || r1 < 0) throw new Error('Require r0 >= r1 >= 0');
  return (2 / (3 * Math.sqrt(2 * mass))) * (r0 ** 1.5 - r1 ** 1.5);
}

/** r(tau) for radial fall from rest at infinity. */
export function radialInfallRadius(r0: number, tau: number, mass = 1): number {
  const power = r0 ** 1.5 - 1.5 * Math.sqrt(2 * mass) * tau;
  return power > 0 ? power ** (2 / 3) : 0;
}

/** Ingoing Kerr–Schild coordinate-time derivative for radial infall from rest at infinity. */
export function radialInfallKSTimeRate(r: number, mass = 1): number {
  const x = Math.sqrt((2 * mass) / r);
  if (Math.abs(x - 1) < 1e-7) return 1.5;
  return (1 - x ** 3) / (1 - x ** 2);
}

export function tortoiseRadius(r: number, mass = 1): number {
  if (r <= 2 * mass) return Number.NaN;
  return r + 2 * mass * Math.log(r / (2 * mass) - 1);
}
