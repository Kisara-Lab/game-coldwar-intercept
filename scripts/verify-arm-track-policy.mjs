import assert from "node:assert/strict";
import * as THREE from "three";
import { readFileSync } from "node:fs";
import { ArmEmitterRuntime } from "../src/arm/emitter-runtime.ts";
import { ARM_EMITTERS } from "../src/arm/catalog.ts";
import {
  ARM_EMITTER_TRACK_MAX_AGE_SECONDS,
  ARM_EMITTER_TRACK_MIN_QUALITY,
  armEmitterTrackIsAdmissible,
  armReleaseAuthorization,
} from "../src/arm/mission-integration.ts";

// The refactor must not move the policy itself: these are the literals the three call sites each
// spelled out on `b6a3270a` (`>= 0.28`, `>= .28`, `<= 12`).
assert.equal(ARM_EMITTER_TRACK_MIN_QUALITY, 0.28, "the shared policy changed the quality threshold");
assert.equal(ARM_EMITTER_TRACK_MAX_AGE_SECONDS, 12, "the shared policy changed the freshness window");

// Boundary behaviour, including which of the two reasons each failure maps to.
const table = [
  { quality: .28, age: 12, admissible: true },
  { quality: .28, age: 12.01, admissible: false },
  { quality: .2799, age: 0, admissible: false },
  { quality: 1, age: 0, admissible: true },
];
for (const row of table) {
  const track = { quality: row.quality, lastUpdate: 100 - row.age };
  assert.equal(armEmitterTrackIsAdmissible(track, 100), row.admissible,
    `predicate disagrees at quality ${row.quality} age ${row.age}`);
}

const emitters = new ArmEmitterRuntime();
emitters.register({ id: "cg57:primary-emitter", platformId: "cg57",
  definition: ARM_EMITTERS["AN-SPY-1-search"], position: new THREE.Vector3(100, 0, 0) });
emitters.setActive("cg57:primary-emitter", true, 1, "search");
const air = { mission: "sead" };
const decide = (quality, age, time) => {
  const track = { targetId: "cg57", quality, lastUpdate: time - age,
    passive: { emitterId: "cg57:primary-emitter" } };
  return armReleaseAuthorization({ aircraft: air, track, emitters, time });
};
const cases = [
  { quality: .28, age: 12, reason: undefined },
  { quality: .2799, age: 0, reason: "EMITTER_TRACK_LOW_QUALITY" },
  { quality: 1, age: 12.01, reason: "EMITTER_TRACK_EXPIRED" },
];
for (const c of cases) {
  const got = decide(c.quality, c.age, 100);
  assert.equal(got.allowed, c.reason === undefined, `authorization flipped at quality ${c.quality} age ${c.age}`);
  assert.equal(got.allowed ? undefined : got.reason, c.reason,
    `reason mapping changed at quality ${c.quality} age ${c.age}`);
  assert.equal(armEmitterTrackIsAdmissible({ quality: c.quality, lastUpdate: 100 - c.age }, 100),
    c.reason === undefined, "predicate and authorization no longer answer the same question");
}

// Wiring: each of the three sites must consult the shared policy instead of its own literals.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const runtimeSource = read("../src/air/runtime.ts");
const seadSource = read("../src/soviet-c2/sead-runtime.ts");
const policySource = read("../src/arm/mission-integration.ts");
assert.ok(runtimeSource.includes("armEmitterTrackIsAdmissible(track, time)"),
  "air/runtime.ts track selection must use the shared predicate");
assert.ok(runtimeSource.includes("candidate.passive?.emitterId === assignment.emitterId && armEmitterTrackIsAdmissible(candidate, time)"),
  "an existing assignment must not bypass the live track policy");
assert.ok(!runtimeSource.includes("track.lastUpdate <= 12 && track.quality >= 0.28"),
  "air/runtime.ts still carries its own copy of the admissibility test");
assert.ok(seadSource.includes("armEmitterTrackIsAdmissible(t, time)"),
  "soviet-c2/sead-runtime.ts cue filter must use the shared predicate");
assert.ok(!seadSource.includes("t.quality >= .28"),
  "soviet-c2/sead-runtime.ts still carries its own copy of the admissibility test");
assert.ok(policySource.includes("input.track.quality < ARM_EMITTER_TRACK_MIN_QUALITY")
  && policySource.includes("input.time - input.track.lastUpdate > ARM_EMITTER_TRACK_MAX_AGE_SECONDS"),
  "the release gate must compare against the shared constants, keeping the two reasons distinct");

// Non-conflation guard: these two 12s are *different* policies (a track lifetime and an
// assignment lifetime) and deliberately keep their own numbers. If a future edit folds them into
// the admissibility window, this fails and someone has to look at why they are not the same thing.
assert.ok(read("../src/ships/sensor-runtime.ts").includes("now - passive.lastUpdate > 12"),
  "the sensor track lifetime is not an admissibility window and must stay separate");
assert.ok(seadSource.includes("expiresAt: time + 12"),
  "the SEAD assignment lifetime is not an admissibility window and must stay separate");

console.log("ARM track policy verification passed:", JSON.stringify({
  minQuality: ARM_EMITTER_TRACK_MIN_QUALITY,
  maxAgeSeconds: ARM_EMITTER_TRACK_MAX_AGE_SECONDS,
  boundaryCases: table.length,
}));
