/**
 * Scenario-declared world scale, in world units per kilometre.
 *
 * The scenario contract requires a positive `simulation.worldUnitsPerKm`, and the
 * guidance map already converts distances with it. Every other distance readout —
 * the console log, the tactical radar rings, and the after-action telemetry — used
 * to divide by a hard-coded constant instead, so a scenario written on a different
 * grid silently disagreed with its own instruments. This module is the single place
 * that resolves the scale, and the runtime and the radar both read it.
 *
 * Positions and distances stay in world units. Sensor horizons and metre-valued
 * measurement errors also use this scale; changing it does not move existing
 * platform or missile positions.
 */

/** The scale every built-in scenario declares, and the fallback for the sandbox. */
export const DEFAULT_WORLD_UNITS_PER_KM = 10;
// Supported display range keeps projection arithmetic bounded for authored scenarios.
export const MIN_WORLD_UNITS_PER_KM = 0.001;
export const MAX_WORLD_UNITS_PER_KM = 1_000_000;
export function isValidWorldUnitsPerKm(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= MIN_WORLD_UNITS_PER_KM && value <= MAX_WORLD_UNITS_PER_KM;
}

/**
 * Accepts a declared scale and returns a usable one. Missing or values outside
 * the supported finite range fall back rather than throwing, because the
 * sandbox runs before any scenario is compiled and must still read out distances.
 */
export function resolveWorldUnitsPerKm(declared: number | undefined): number {
  if (!isValidWorldUnitsPerKm(declared))
    return DEFAULT_WORLD_UNITS_PER_KM;
  return declared;
}

/** Converts a world-unit distance into kilometres for display and telemetry. */
export function kilometresFromWorldUnits(worldUnits: number, unitsPerKm: number): number {
  return worldUnits / resolveWorldUnitsPerKm(unitsPerKm);
}

/** Converts a kilometre distance into world units for display-only geometry. */
export function worldUnitsFromKilometres(kilometres: number, unitsPerKm: number): number {
  return kilometres * resolveWorldUnitsPerKm(unitsPerKm);
}
