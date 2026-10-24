import { createSeaSkimmerModel } from "./sea-skimmer-model.js";
import type { ThreatDefinition } from "./types.js";

// R-360 anti-ship baseline, not the later land-attack/Long Neptune variants.
// Geometry follows the 5.05 m / .38 m class proportions at an enlarged display scale.
function createModel() {
  return createSeaSkimmerModel({
    identity: "R-360 Neptune", length: 7.575, radius: .285, noseLength: .95,
    noseShape: "rounded", skinColor: 0x8b9980, radomeColor: 0xc9d0c1,
    wingZ: .1, wingSpan: .7, wingChord: .94, sweptWings: true,
    tailSpan: .48, tailChord: .67,
    intake: { length: 1.85, width: .51, depth: .28, z: .98 },
    exhaustLength: 1.1,
  });
}

export const NEPTUNE = {
  id: "R-360 Neptune",
  // Game-scale calibration, not a real-world performance specification.
  profile: {
    cruiseAltitude: .3, terminalAltitude: .1, terminalAt: 130,
    seekerFieldOfViewDeg: 50, seekerAcquisitionRangeFactor: 1.15, targetLostCoastSeconds: 12,
    cruiseSpeed: 5.8, terminalSpeed: 6.4, turnRate: 11, damage: 18,
    defaultRange: 500, burnThroughRange: 22, radarCrossSection: .14,
    modelScale: .82, selectionRadius: 3.2, pathColor: 0x8bd4bb, threatPriority: 6,
    trajectory: "sea-skimmer", ciwsPenalty: .08,
    terminalAttackModes: ["skim"],
    weave: { lateral: 0, longitudinal: 0, lateralRate: 0, longitudinalRate: 0 },
  },
  preset: { label: "NEPTUNE RAID", count: 6, interval: 1.5, altitude: .3, spread: 160, range: 500 },
  createModel,
} as const satisfies ThreatDefinition;
