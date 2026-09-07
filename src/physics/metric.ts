import type { Mat4, Vec3, Vec4 } from './types';
import { dot3, norm3 } from './types';

export function ksRadius(x: Vec3): number {
  return norm3(x);
}

export function schwarzschildKSCovariant(x: Vec3, mass = 1): Mat4 {
  const r = ksRadius(x);
  if (!(r > 0)) throw new Error('Schwarzschild metric is undefined at r=0');
  const n: Vec3 = [x[0] / r, x[1] / r, x[2] / r];
  const f = (2 * mass) / r;
  const l: Vec4 = [1, n[0], n[1], n[2]];
  const eta = [-1, 1, 1, 1];
  return [0, 1, 2, 3].map((mu) =>
    [0, 1, 2, 3].map((nu) => (mu === nu ? eta[mu]! : 0) + f * l[mu]! * l[nu]!) as Vec4,
  ) as Mat4;
}

export function schwarzschildKSContravariant(x: Vec3, mass = 1): Mat4 {
  const r = ksRadius(x);
  if (!(r > 0)) throw new Error('Schwarzschild metric is undefined at r=0');
  const n: Vec3 = [x[0] / r, x[1] / r, x[2] / r];
  const f = (2 * mass) / r;
  const lUp: Vec4 = [-1, n[0], n[1], n[2]];
  const eta = [-1, 1, 1, 1];
  return [0, 1, 2, 3].map((mu) =>
    [0, 1, 2, 3].map((nu) => (mu === nu ? eta[mu]! : 0) - f * lUp[mu]! * lUp[nu]!) as Vec4,
  ) as Mat4;
}

export function matVec(m: Mat4, v: Vec4): Vec4 {
  return m.map((row) => row.reduce((s, value, i) => s + value * v[i]!, 0)) as Vec4;
}

export function bilinear(g: Mat4, a: Vec4, b: Vec4): number {
  const gb = matVec(g, b);
  return a.reduce((s, value, i) => s + value * gb[i]!, 0);
}

export function lower(x: Vec3, v: Vec4, mass = 1): Vec4 {
  return matVec(schwarzschildKSCovariant(x, mass), v);
}

export function raise(x: Vec3, p: Vec4, mass = 1): Vec4 {
  return matVec(schwarzschildKSContravariant(x, mass), p);
}

export function hamiltonian(x: Vec3, p: Vec4, mass = 1): number {
  const raised = raise(x, p, mass);
  return 0.5 * p.reduce((sum, value, i) => sum + value * raised[i]!, 0);
}

export interface CanonicalDerivative {
  dt: number;
  dx: Vec3;
  dp: Vec3;
}

/** Exact Hamilton equations for Schwarzschild in Cartesian Kerr–Schild coordinates. */
export function canonicalDerivative(x: Vec3, p: Vec4, mass = 1): CanonicalDerivative {
  const r = norm3(x);
  if (!(r > 0)) throw new Error('Singularity reached');
  const n: Vec3 = [x[0] / r, x[1] / r, x[2] / r];
  const spatial: Vec3 = [p[1], p[2], p[3]];
  const f = (2 * mass) / r;
  const ndotp = dot3(n, spatial);
  const q = -p[0] + ndotp;
  const dx: Vec3 = [
    spatial[0] - f * n[0] * q,
    spatial[1] - f * n[1] * q,
    spatial[2] - f * n[2] * q,
  ];
  const dp: Vec3 = [0, 1, 2].map((i) => {
    const df = (-f * n[i]!) / r;
    const dq = (spatial[i]! - ndotp * n[i]!) / r;
    return 0.5 * df * q * q + f * q * dq;
  }) as Vec3;
  return { dt: -p[0] + f * q, dx, dp };
}
