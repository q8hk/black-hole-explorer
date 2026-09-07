import { bilinear, schwarzschildKSCovariant } from './metric';
import type { Vec3, Vec4 } from './types';

const scale4 = (v: Vec4, s: number): Vec4 => v.map((x) => x * s) as Vec4;
const sub4 = (a: Vec4, b: Vec4): Vec4 => a.map((x, i) => x - b[i]!) as Vec4;

export function normalizeTimelike(x: Vec3, v: Vec4, mass = 1): Vec4 {
  const g = schwarzschildKSCovariant(x, mass);
  const n2 = bilinear(g, v, v);
  if (!(n2 < 0)) throw new Error('Four-velocity seed is not timelike');
  const out = scale4(v, 1 / Math.sqrt(-n2));
  return out[0] < 0 ? scale4(out, -1) : out;
}

/** Metric Gram–Schmidt tetrad. Spatial seeds are coordinate directions, not a transport law. */
export function buildTetrad(x: Vec3, velocity: Vec4, mass = 1): [Vec4, Vec4, Vec4, Vec4] {
  const g = schwarzschildKSCovariant(x, mass);
  const e0 = normalizeTimelike(x, velocity, mass);
  const basis: Vec4[] = [e0];
  const seeds: Vec4[] = [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  for (const seed of seeds) {
    let v = seed;
    for (let i = 0; i < basis.length; i += 1) {
      const e = basis[i]!;
      const sign = i === 0 ? -1 : 1;
      v = sub4(v, scale4(e, sign * bilinear(g, v, e)));
    }
    const n2 = bilinear(g, v, v);
    if (n2 > 1e-12) basis.push(scale4(v, 1 / Math.sqrt(n2)));
  }
  if (basis.length !== 4) throw new Error('Degenerate tetrad seeds');
  return basis as [Vec4, Vec4, Vec4, Vec4];
}

export function staticObserverVelocity(x: Vec3, mass = 1): Vec4 {
  const r = Math.hypot(...x);
  if (r <= 2 * mass) throw new Error('No static observer exists at or inside the horizon');
  return normalizeTimelike(x, [1, 0, 0, 0], mass);
}
