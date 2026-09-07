import { describe, expect, it } from 'vitest';
import { bilinear, hamiltonian, matVec, schwarzschildKSCovariant, schwarzschildKSContravariant } from '../src/physics/metric';
import { criticalImpactParameter, photonSphereRadius, radialTidalAcceleration, schwarzschildISCO, stationaryGravitationalRedshiftToInfinity, stationaryTimeDilation } from '../src/physics/observables';
import { radialInfallKSTimeRate, radialInfallProperTime, radialInfallRadius } from '../src/physics/radial';
import { buildTetrad, staticObserverVelocity } from '../src/physics/tetrad';
import { schwarzschildRadiusKm } from '../src/physics/units';
import { pulseArrivalTime } from '../src/physics/signals';
import { lower } from '../src/physics/metric';
import { constraintDrift, rk4Step, type WorldlineState } from '../src/physics/integrator';

describe('Schwarzschild analytic results', () => {
  it('computes the solar Schwarzschild radius', () => expect(schwarzschildRadiusKm(1)).toBeCloseTo(2.95334, 4));
  it('has photon sphere 3M, ISCO 6M, and critical b=3sqrt(3)M', () => {
    expect(photonSphereRadius()).toBe(3);
    expect(schwarzschildISCO()).toBe(6);
    expect(criticalImpactParameter()).toBeCloseTo(5.196152423, 9);
  });
  it('matches stationary time dilation and redshift', () => {
    expect(stationaryTimeDilation(8)).toBeCloseTo(Math.sqrt(0.75), 12);
    expect(stationaryGravitationalRedshiftToInfinity(8)).toBeCloseTo(1 / Math.sqrt(0.75) - 1, 12);
  });
  it('crosses the horizon in finite proper time', () => {
    const tau = radialInfallProperTime(10, 2);
    expect(tau).toBeGreaterThan(0);
    expect(radialInfallRadius(10, tau)).toBeCloseTo(2, 10);
    expect(radialInfallKSTimeRate(2)).toBeCloseTo(1.5, 8);
  });
  it('forbids outgoing signals emitted at or inside the horizon', () => {
    expect(pulseArrivalTime(0, 2, 80)).toBeNull();
    expect(pulseArrivalTime(0, 1.9, 80)).toBeNull();
    expect(pulseArrivalTime(0, 2.1, 80)).toBeTypeOf('number');
  });
  it('makes horizon tidal forces scale as inverse mass squared', () => {
    const stellar = radialTidalAcceleration(10, 2);
    const supermassive = radialTidalAcceleration(1e6, 2);
    expect(stellar / supermassive).toBeCloseTo(1e10, -4);
  });
});

describe('Kerr-Schild metric and observer frame', () => {
  const x: [number, number, number] = [8, 1, -2];
  it('covariant and contravariant metrics are inverses', () => {
    const g = schwarzschildKSCovariant(x);
    const gi = schwarzschildKSContravariant(x);
    for (let i = 0; i < 4; i += 1) {
      const col = [gi[0][i]!, gi[1][i]!, gi[2][i]!, gi[3][i]!] as [number, number, number, number];
      const product = matVec(g, col);
      for (let j = 0; j < 4; j += 1) expect(product[j]).toBeCloseTo(i === j ? 1 : 0, 11);
    }
  });
  it('constructs an orthonormal tetrad', () => {
    const tetrad = buildTetrad(x, staticObserverVelocity(x));
    const g = schwarzschildKSCovariant(x);
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        expect(bilinear(g, tetrad[i]!, tetrad[j]!)).toBeCloseTo(i === j ? (i === 0 ? -1 : 1) : 0, 10);
      }
    }
    expect(hamiltonian(x, [-1, 1, 0, 0])).toBeTypeOf('number');
  });
  it('keeps a free-fall worldline timelike while crossing r=2M', () => {
    const start: [number,number,number] = [6,0,0];
    const u = staticObserverVelocity(start);
    let state: WorldlineState = { t:0, tau:0, x:start, p:lower(start,u) };
    const energy = state.p[0];
    let crossedAt:number|null=null;
    for(let i=0;i<20_000;i+=1){
      state=rk4Step(state,.001);
      if(Math.hypot(...state.x)<2&&crossedAt==null){crossedAt=state.tau;break;}
    }
    expect(crossedAt).not.toBeNull();
    expect(crossedAt!).toBeLessThan(20);
    expect(state.p[0]).toBe(energy);
    expect(constraintDrift(state)).toBeLessThan(1e-9);
  });
});
