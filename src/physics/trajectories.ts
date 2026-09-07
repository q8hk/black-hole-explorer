import { lower } from './metric';
import { buildTetrad, staticObserverVelocity } from './tetrad';
import type { WorldlineState } from './integrator';
import type { Vec3, Vec4 } from './types';

export type TrajectoryKey = 'approach'|'radial'|'flyby'|'encounter'|'circular'|'isco'|'critical';

export interface TrajectoryPreset {
  key: TrajectoryKey;
  name: string;
  description: string;
  radius: number;
  radialVelocity: number;
  tangentialVelocity: number;
  expectedOutcome: 'capture'|'escape'|'bound'|'near-critical';
}

const circularSpeed = (radius:number) => Math.sqrt(1/(radius-2));

export const trajectoryPresets: Record<TrajectoryKey,TrajectoryPreset> = {
  approach:{key:'approach',name:'Approach',description:'Close, off-axis approach that opens with the lens in view',radius:14,radialVelocity:-.24,tangentialVelocity:.16,expectedOutcome:'capture'},
  radial:{key:'radial',name:'Radial plunge',description:'Near-radial educational horizon crossing',radius:8,radialVelocity:-.12,tangentialVelocity:0,expectedOutcome:'capture'},
  flyby:{key:'flyby',name:'Flyby',description:'Unbound encounter with strong gravitational deflection',radius:40,radialVelocity:-.34,tangentialVelocity:.28,expectedOutcome:'escape'},
  encounter:{key:'encounter',name:'Orbital encounter',description:'Close angular-momentum-supported encounter',radius:12,radialVelocity:-.08,tangentialVelocity:.38,expectedOutcome:'bound'},
  circular:{key:'circular',name:'Circular orbit · 10M',description:'Stable circular geodesic outside the ISCO',radius:10,radialVelocity:0,tangentialVelocity:circularSpeed(10),expectedOutcome:'bound'},
  isco:{key:'isco',name:'ISCO · 6M',description:'Innermost stable circular Schwarzschild orbit',radius:6,radialVelocity:0,tangentialVelocity:.5,expectedOutcome:'bound'},
  critical:{key:'critical',name:'Near-critical plunge',description:'Close to the capture/escape separatrix',radius:20,radialVelocity:-.25,tangentialVelocity:.205,expectedOutcome:'near-critical'},
};

export function localVelocityFourVector(x:Vec3,radialVelocity:number,tangentialVelocity:number):Vec4 {
  const speed2=radialVelocity**2+tangentialVelocity**2;
  if(!(speed2<1)) throw new Error('Local trajectory speed must be subluminal');
  const frame=buildTetrad(x,staticObserverVelocity(x));
  const gamma=1/Math.sqrt(1-speed2);
  return frame[0].map((value,i)=>gamma*(value+radialVelocity*frame[1][i]!+tangentialVelocity*frame[2][i]!)) as Vec4;
}

export function createTrajectoryState(key:TrajectoryKey):WorldlineState {
  const preset=trajectoryPresets[key];
  const x:Vec3=[preset.radius,0,0];
  const u=localVelocityFourVector(x,preset.radialVelocity,preset.tangentialVelocity);
  return {t:0,tau:0,x,p:lower(x,u)};
}

export function trajectoryConstants(state:WorldlineState){
  return {energy:-state.p[0],angularMomentum:state.x[0]*state.p[2]-state.x[1]*state.p[1]};
}

export function progradeYaw(key:TrajectoryKey):number {
  const p=trajectoryPresets[key];
  return Math.atan2(p.tangentialVelocity,-p.radialVelocity);
}
