import type { AirPlatformInstance, AirTrack } from "../air/types.js";
import type { ArmEmitterRuntime } from "./emitter-runtime.js";

/**
 * The emitter-track admissibility policy, shared by the places that ask the same question about
 * the same objects: the SEAD release gate below, the air runtime's own passive-track selection and
 * the Soviet SEAD cue filter. Each of them used to spell the test out with its own literals
 * (`>= 0.28`, `>= .28`), so retuning one site silently splits the policy; the visible symptom is an
 * aircraft being steered onto a track it is then refused permission to engage.
 */
export const ARM_EMITTER_TRACK_MIN_QUALITY = 0.28;
export const ARM_EMITTER_TRACK_MAX_AGE_SECONDS = 12;

export function armEmitterTrackIsAdmissible(track: { quality: number; lastUpdate: number }, time: number) {
  return track.quality >= ARM_EMITTER_TRACK_MIN_QUALITY &&
    time - track.lastUpdate <= ARM_EMITTER_TRACK_MAX_AGE_SECONDS;
}

/**
 * SEAD release gate.  An ARM may only be released against a confirmed
 * emitter track; a generic platform track is deliberately insufficient.
 */
export function armReleaseAuthorization(input: {
  aircraft: AirPlatformInstance;
  track: AirTrack;
  emitters: ArmEmitterRuntime;
  time: number;
}): { allowed: true; emitterId: string } | { allowed: false; reason: string } {
  if (input.aircraft.mission !== "sead")
    return { allowed: false, reason: "MISSION_NOT_SEAD" };
  const passive = input.track.passive;
  const emitterId = passive?.emitterId;
  if (!emitterId) return { allowed: false, reason: "NO_EMITTER_TRACK" };
  const emitter = input.emitters.emitters.get(emitterId) ??
    [...input.emitters.emitters.values()].find((candidate) =>
      candidate.platformId === input.track.targetId || candidate.id.startsWith(`${input.track.targetId}:`));
  if (!emitter) return { allowed: false, reason: "EMITTER_UNKNOWN" };
  if (!emitter.active && !passive?.emitterType)
    return { allowed: false, reason: "EMITTER_NOT_CONFIRMED" };
  if (input.track.quality < ARM_EMITTER_TRACK_MIN_QUALITY)
    return { allowed: false, reason: "EMITTER_TRACK_LOW_QUALITY" };
  if (input.time - input.track.lastUpdate > ARM_EMITTER_TRACK_MAX_AGE_SECONDS)
    return { allowed: false, reason: "EMITTER_TRACK_EXPIRED" };
  return { allowed: true, emitterId: emitter.id };
}
