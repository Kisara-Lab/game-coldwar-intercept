import { createSeaSkimmerModel } from "./sea-skimmer-model.js";
import type { ThreatDefinition } from "./types.js";

// Type 80 ASM-1: solid-rocket configuration, no air-breathing engine intake.
function createModel() {
  return createSeaSkimmerModel({
    identity: "ASM-1", length: 6, radius: .2625, noseLength: 1.04,
    noseShape: "pointed", skinColor: 0xe2dfd3, radomeColor: 0x4c5355,
    wingZ: -.35, wingSpan: .6375, wingChord: 1.22, sweptWings: true,
    tailSpan: .47, tailChord: .7, exhaustLength: 1.65,
  });
}

export const ASM1 = {
  id: "ASM-1",
  profile: {
    cruiseAltitude: .4, terminalAltitude: .14, terminalAt: 130,
    seekerFieldOfViewDeg: 50, seekerAcquisitionRangeFactor: 1.15, targetLostCoastSeconds: 12,
    cruiseSpeed: 5.8, terminalSpeed: 6.4, turnRate: 11, damage: 18,
    defaultRange: 360, burnThroughRange: 22, radarCrossSection: .13,
    modelScale: .82, selectionRadius: 3, pathColor: 0xe9bbac, threatPriority: 6,
    trajectory: "sea-skimmer", ciwsPenalty: .08,
    terminalAttackModes: ["skim"],
    weave: { lateral: 0, longitudinal: 0, lateralRate: 0, longitudinalRate: 0 },
  },
  preset: { label: "ASM-1 RAID", count: 6, interval: 1.5, altitude: .4, spread: 160, range: 360 },
  createModel,
} as const satisfies ThreatDefinition;
