import { tortoiseRadius } from './radial';

export interface Pulse {
  sequence: number;
  emittedTau: number;
  emittedKS: number;
  emittedR: number;
  arrivalSchwarzschildTime: number | null;
}

/** Exact radial outgoing-null arrival time, for emission and reception outside r=2M. */
export function pulseArrivalTime(
  emittedKS: number,
  emittedR: number,
  observerR: number,
  mass = 1,
): number | null {
  if (emittedR <= 2 * mass || observerR <= emittedR) return null;
  const emittedSchwarzschild = emittedKS - 2 * mass * Math.log(emittedR / (2 * mass) - 1);
  return emittedSchwarzschild + tortoiseRadius(observerR, mass) - tortoiseRadius(emittedR, mass);
}

export function receivedFrequencyRatio(previous: Pulse, current: Pulse): number | null {
  if (previous.arrivalSchwarzschildTime == null || current.arrivalSchwarzschildTime == null) return null;
  const arrivalInterval = current.arrivalSchwarzschildTime - previous.arrivalSchwarzschildTime;
  const emissionInterval = current.emittedTau - previous.emittedTau;
  return arrivalInterval > 0 ? emissionInterval / arrivalInterval : null;
}
