import { resolveWorldUnitsPerKm } from "../scenario-system/world-scale.js";

/** Legacy sensor/telemetry altitude scale; independent of horizontal scenario scale.
 * The flight-energy model deliberately uses its own aerodynamic height calibration.
 */
export const SENSOR_ALTITUDE_METERS_PER_UNIT = 50;
export const RADIO_HORIZON_KM_PER_SQRT_METER = 4.12;

export function radarHorizonWorldUnits(aMeters: number, bMeters: number, unitsPerKm?: number) {
  return RADIO_HORIZON_KM_PER_SQRT_METER * resolveWorldUnitsPerKm(unitsPerKm) *
    (Math.sqrt(Math.max(0, aMeters)) + Math.sqrt(Math.max(0, bMeters)));
}

export function uncertaintyMetersToWorld(meters: number, unitsPerKm?: number) {
  return meters * resolveWorldUnitsPerKm(unitsPerKm) / 1000;
}

/** These calibrations describe different nominal-range/quality contracts, not
 * different units. All inputs are game-effective square metres. Changing a
 * reference or envelope is a balance change and needs consumer-level tests.
 */
export const RCS_PROFILES = {
  shipSearch: { referenceM2: 0.5, minimumRatio: 0.05, minimum: 0, maximum: Infinity },
  airSearch: { referenceM2: 8, minimumRatio: 0.05, minimum: 0, maximum: Infinity },
  surfaceSearch: { referenceM2: 10, minimumRatio: 0.05, minimum: 0, maximum: Infinity },
  airSeeker: { referenceM2: 8, minimumRatio: 0, minimum: 0.32, maximum: 1.25 },
  maritimeCue: { referenceM2: 12000, minimumRatio: 0.05, minimum: 0.22, maximum: 1 },
} as const;

export function radarCrossSectionFactor(rcsM2: number, profile: keyof typeof RCS_PROFILES) {
  const p = RCS_PROFILES[profile];
  const value = Math.pow(Math.max(p.minimumRatio, Math.max(0, rcsM2) / p.referenceM2), 0.25);
  return Math.max(p.minimum, Math.min(p.maximum, value));
}
