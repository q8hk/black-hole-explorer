import { describe,expect,it } from 'vitest';
import { bilinear,raise,schwarzschildKSCovariant } from '../src/physics/metric';
import { constraintDrift,rk4Step } from '../src/physics/integrator';
import { createTrajectoryState,trajectoryConstants,trajectoryPresets } from '../src/physics/trajectories';

function evolve(key:'approach'|'radial'|'flyby',maxTau=500){
  let state=createTrajectoryState(key),minimumRadius=Math.hypot(...state.x),horizonCrossingTau:number|null=null;
  while(state.tau<maxTau&&Math.hypot(...state.x)>.15){
    const r=Math.hypot(...state.x),h=Math.min(.01,.002*Math.max(r,.5));
    state=rk4Step(state,h);minimumRadius=Math.min(minimumRadius,Math.hypot(...state.x));
    if(horizonCrossingTau==null&&Math.hypot(...state.x)<2)horizonCrossingTau=state.tau;
    if(key==='flyby'&&state.tau>30&&Math.hypot(...state.x)>55)break;
  }
  return {state,minimumRadius,horizonCrossingTau};
}

describe('trajectory presets',()=>{
  for(const preset of Object.values(trajectoryPresets)){
    it(`${preset.name} starts timelike and subluminal`,()=>{
      const state=createTrajectoryState(preset.key),u=raise(state.x,state.p),g=schwarzschildKSCovariant(state.x);
      expect(bilinear(g,u,u)).toBeCloseTo(-1,10);
      expect(preset.radialVelocity**2+preset.tangentialVelocity**2).toBeLessThan(1);
      expect(constraintDrift(state)).toBeLessThan(1e-10);
    });
  }

  it('matches analytic circular-orbit energy and angular momentum at 10M',()=>{
    const {energy,angularMomentum}=trajectoryConstants(createTrajectoryState('circular'));
    expect(energy).toBeCloseTo((1-2/10)/Math.sqrt(1-3/10),10);
    expect(angularMomentum).toBeCloseTo(Math.sqrt(10)/Math.sqrt(1-3/10),10);
  });

  it('matches analytic ISCO energy and angular momentum',()=>{
    const {energy,angularMomentum}=trajectoryConstants(createTrajectoryState('isco'));
    expect(energy).toBeCloseTo(Math.sqrt(8/9),10);
    expect(angularMomentum).toBeCloseTo(Math.sqrt(12),10);
  });

  it('conserves E and L on the default approach',()=>{
    let state=createTrajectoryState('approach');
    const initial=trajectoryConstants(state);
    for(let i=0;i<4000;i++) state=rk4Step(state,.002);
    const final=trajectoryConstants(state);
    expect(final.energy).toBe(initial.energy);
    expect(final.angularMomentum).toBeCloseTo(initial.angularMomentum,8);
    expect(constraintDrift(state)).toBeLessThan(1e-8);
  });

  it('the approach and radial plunge cross the horizon in finite proper time',()=>{
    for(const key of ['approach','radial'] as const){
      const {minimumRadius,horizonCrossingTau}=evolve(key);
      expect(minimumRadius).toBeLessThan(2);
      expect(horizonCrossingTau).not.toBeNull();
      expect(horizonCrossingTau!).toBeLessThan(500);
    }
  });

  it('the flyby turns around, is deflected, and escapes',()=>{
    const {state,minimumRadius}=evolve('flyby');
    expect(minimumRadius).toBeGreaterThan(2);
    expect(Math.hypot(...state.x)).toBeGreaterThan(55);
    expect(Math.abs(state.x[1])).toBeGreaterThan(5);
    expect(constraintDrift(state)).toBeLessThan(1e-6);
  });
});
