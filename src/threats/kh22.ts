import { createKh22RefinedModel } from "./kh22-refined.js";
import type { ThreatDefinition } from "./types.js";

export const KH22 = {
  id: "Kh-22",
  profile: {
    cruiseAltitude: 360,
    terminalAltitude: 2.2,
    terminalAt: 450,
    cruiseSpeed: 13.2,
    terminalSpeed: 15.2,
    turnRate: 4.5,
    damage: 46,
    defaultRange: 1000,
    burnThroughRange: 26,
    radarCrossSection: 1.1,
    modelScale: 0.92,
    selectionRadius: 4.2,
    pathColor: 0xffb05a,
    threatPriority: 45,
    trajectory: "high-altitude",
    ciwsPenalty: 0.3,
    ciwsPkCap: 0.14,
    weave: {
      lateral: 0,
      longitudinal: 0,
      lateralRate: 0,
      longitudinalRate: 0,
    },
  },
  preset: {
    label: "HIGH SPEED",
    count: 8,
    interval: 2,
    altitude: 360,
    spread: 190,
    range: 1000,
  },
  createModel: () => createKh22RefinedModel(),
} as const satisfies ThreatDefinition;
