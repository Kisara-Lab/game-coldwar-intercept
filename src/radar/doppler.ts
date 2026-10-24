import { resolveWorldUnitsPerKm } from "../scenario-system/world-scale.js";
import { SENSOR_ALTITUDE_METERS_PER_UNIT } from "./model.js";

type Vector = { x: number; y: number; z: number };
export interface PulseDopplerProfile {
  /** Game tuning in horizontal world units/second, not a hardware specification. */
  notchHalfWidth: number;
  minimumFactor: number;
  minimumLookDownDeg: number;
}
export interface DopplerObservation {
  sensorPosition: Vector;
  sensorVelocity: Vector;
  targetPosition: Vector;
  targetVelocity: Vector;
}

/** Flat ground/sea clutter approximation. Subtract the stationary terrain's
 * apparent radial rate from the relative rate: a moving radar must not turn a
 * beaming target into a high-Doppler return solely due to its own translation.
 * Vertical flight remains outside this horizontal, game-scaled filter model.
 */
export function pulseDopplerFactors(profile?: PulseDopplerProfile, observation?: DopplerObservation, worldUnitsPerKm?: number) {
  const neutral = { factor: 1, closingRate: 0, clutterSeparation: 0, clutter: false };
  if (!profile || !observation) return neutral;
  if (![profile.notchHalfWidth, profile.minimumFactor, profile.minimumLookDownDeg].every(Number.isFinite) ||
      profile.notchHalfWidth <= 0 || profile.minimumFactor < 0 || profile.minimumFactor > 1 ||
      profile.minimumLookDownDeg < 0 || profile.minimumLookDownDeg >= 90) return neutral;
  const {sensorPosition:s, sensorVelocity:sv, targetPosition:t, targetVelocity:tv} = observation;
  if (![s,sv,t,tv].every(v => [v.x,v.y,v.z].every(Number.isFinite))) return neutral;
  const dx=t.x-s.x, dz=t.z-s.z, range=Math.hypot(dx,dz);
  if (range < 1e-9) return neutral;
  const ux=dx/range, uz=dz/range;
  const closingRate=-((tv.x-sv.x)*ux+(tv.z-sv.z)*uz);
  const clutterSeparation=Math.abs(tv.x*ux+tv.z*uz);
  const depression=Math.atan2((s.y-t.y)*SENSOR_ALTITUDE_METERS_PER_UNIT,
    range*1000/resolveWorldUnitsPerKm(worldUnitsPerKm))*180/Math.PI;
  const clutter=s.y>t.y && depression>=profile.minimumLookDownDeg;
  const fraction=Math.min(1,clutterSeparation/profile.notchHalfWidth);
  return { factor: clutter ? profile.minimumFactor+(1-profile.minimumFactor)*fraction : 1,
    closingRate, clutterSeparation, clutter };
}
