# Wiki Versioning

The package and HUD remain `1.21.1`, matching the latest release tag (2026-08-12). This page and current entry points were checked against main on 2026-10-24. Later work belongs to [Unreleased](../../CHANGELOG.md), not retrospectively to v1.21.1. Individual pages may retain their last material-update snapshot; an older header does not mean feature removal. Values are game-scaled, not real-world deployment data. Update both languages when mechanisms change.

## v1.21 and current main

v1.21.0 introduced versioned scenarios, Full-Spectrum Blackout, space weather and lost-comms doctrine; v1.21.1 corrected orchestration, missions and objective settlement. Later main includes passive sensing, CEC, ARM/SEAD and radar scale/Doppler changes. See [architecture](../../ARCHITECTURE.md) and the [radar specification](../../docs/zh/RADAR-MODEL.md) for ownership and limits.

## v1.15.0 documentation boundary

v1.15.0 applies a second refinement pass to the six procedural air assets: it corrects shared loft-fuselage normals, improves nozzles, the arresting hook, tail guns, markings, lights, and AEW animation, unifies model and runtime station definitions, and moves F-14 wing sweep to a model-declared 20°–68° geometry contract. The six aircraft retain the common 2 m/unit display scale and separately constructed Ultra, High, and Low geometry.

Platform-page model sections describe this asset release; flight, radar, weapon, and AI values remain game-scaled and do not become real-world performance data because the silhouettes are more detailed. Structural model tests and 63 serial static captures can establish relative dimensions, independent LOD ownership, identifying features, and store contact. They do not replace joint-scenario regression for flight, combat, damage, or AAR behavior.

## v1.1.0 historical boundary

v1.1.0 first placed the six aircraft on one 2 m/unit visual scale and introduced independently constructed Ultra, High, and Low geometry. The v1.0.0 runtime/catalog release must not be described retrospectively as containing those refined assets; v1.15.0 is a later refinement and does not rewrite the historical tag.

Stable means part of the standard entity and telemetry loop; Optional requires a scenario/settings switch; Experimental may change output or performance. These labels do not imply inclusion in a historical release tag.

## Current capability notes

Passive IRST/ESM sensing, EMCON, and CEC are implemented as explicit, era-gated runtime capabilities. CEC is restricted to the `cec-enabled` US network configuration; Soviet platforms do not receive Link 16 or CEC. The `MIG-29A-SEAD` / `Kh-31P-C` pair is a fictional late-Soviet concept and is rejected in earlier eras.

**Passive sensing / emission-control chain**: IRST, ESM, passive tracks, fusion and EMCON are implemented on capable platforms; passive observations do not grant target truth or unrestricted firing authority.

**CEC (Cooperative Engagement Capability)**: separate measurement/covariance fusion, networking, engagement support and missile updates are implemented. Link 11/16 sharing alone is not CEC. Remote support preserves physical launch and terminal-acquisition gates. Historical AIM-54A/C updates remain launcher-owned; the hypothetical AIM-54X CEC has a separate contract.

**Anti-radiation operations and missiles**: emitter state, observed tracks, dedicated seeker acquisition/loss/reacquisition and SEAD mission integration are implemented. Era and catalog gates apply; availability is not universal.

Carrier operations, aerial refuelling, towed decoys and a sandbox scenario editor remain future work. WebGPU Ultra remains an experimental hybrid backend.
