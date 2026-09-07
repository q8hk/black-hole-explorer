import { canonicalDerivative, hamiltonian } from './metric';
import type { Vec3, Vec4 } from './types';

export interface WorldlineState {
  t: number;
  tau: number;
  x: Vec3;
  p: Vec4;
}

function derivative(state: WorldlineState, mass: number): number[] {
  const d = canonicalDerivative(state.x, state.p, mass);
  return [d.dt, 1, ...d.dx, 0, ...d.dp];
}

function pack(s: WorldlineState): number[] {
  return [s.t, s.tau, ...s.x, ...s.p];
}

function unpack(a: number[]): WorldlineState {
  return {
    t: a[0]!, tau: a[1]!,
    x: [a[2]!, a[3]!, a[4]!],
    p: [a[5]!, a[6]!, a[7]!, a[8]!],
  };
}

export function rk4Step(state: WorldlineState, h: number, mass = 1): WorldlineState {
  const y = pack(state);
  const evalAt = (base: number[], k: number[], scale: number) => derivative(unpack(base.map((v, i) => v + scale * k[i]!)), mass);
  const k1 = derivative(state, mass);
  const k2 = evalAt(y, k1, h / 2);
  const k3 = evalAt(y, k2, h / 2);
  const k4 = evalAt(y, k3, h);
  return unpack(y.map((v, i) => v + (h / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!)));
}

export function constraintDrift(state: WorldlineState, target = -0.5, mass = 1): number {
  return Math.abs(hamiltonian(state.x, state.p, mass) - target);
}
