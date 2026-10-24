import { createSeaSkimmerModel } from "./sea-skimmer-model.js";
import type { ThreatDefinition } from "./types.js";

// Basic 3M24/Kh-35 cruise configuration after booster separation; not Kh-35U/UE.
function createModel() {
  return createSeaSkimmerModel({
    identity: "3M24 Uran", length: 5.775, radius: .315, noseLength: .78,
    noseShape: "rounded", skinColor: 0xd6d9d1, radomeColor: 0x505b60,
    wingZ: -.18, wingSpan: .68, wingChord: .68, sweptWings: false,
    tailSpan: .5, tailChord: .59,
    intake: { length: 1.38, width: .46, depth: .32, z: .75 },
    exhaustLength: 1,
  });
}

export const URAN = {
  id: "3M24 Uran",
  profile: {
    cruiseAltitude: .3, terminalAltitude: .08, terminalAt: 130,
    seekerFieldOfViewDeg: 50, seekerAcquisitionRangeFactor: 1.15, targetLostCoastSeconds: 12,
    cruiseSpeed: 5.8, terminalSpeed: 6.4, turnRate: 11, damage: 17,
    defaultRange: 420, burnThroughRange: 22, radarCrossSection: .12,
    modelScale: .82, selectionRadius: 3, pathColor: 0x91b8e3, threatPriority: 6,
    trajectory: "sea-skimmer", ciwsPenalty: .08,
    terminalAttackModes: ["skim"],
    weave: { lateral: 0, longitudinal: 0, lateralRate: 0, longitudinalRate: 0 },
  },
  preset: { label: "URAN RAID", count: 6, interval: 1.5, altitude: .3, spread: 160, range: 420 },
  createModel,
} as const satisfies ThreatDefinition;
