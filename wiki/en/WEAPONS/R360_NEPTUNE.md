# R-360 Neptune

> Current main · Unreleased. Baseline anti-ship variant; no land-attack or Long Neptune capability.

[Weapons](README.md) · [Parameters](MISSILE_PARAMETERS.md) · [中文](../../WEAPONS/R360_NEPTUNE.md)

## Public reference and appearance

Ukrainian subsonic anti-ship cruise missile with air-breathing cruise propulsion and terminal active radar guidance. Public figures include roughly 5.05 m overall length, .38 m diameter, a 150 kg warhead and a 280 km-class range. Overall length may include the booster; it is not an engineering dimension guarantee for the game cruise model. The procedural asset has a slender body, rounded radome, swept cruciform wings and a ventral intake. Launcher and booster separation are not represented.

## Game implementation

![Neptune procedural-asset inspection](../../../verification-threat-r-360-neptune-ultra.png)

- Stable ID: `R-360 Neptune`; definition: `src/threats/neptune.ts`.
- Select `NEPTUNE RAID` or an `in-flight` scenario wave. No coastal launch platform is added.
- Cruise/terminal altitude: `.3 / .1`; speed: `5.8 / 6.4`; damage: `18`; RCS: `.14`. These are game-scale assumptions.
- Default spawn distance `500` is in world units (50 km at the default scenario scale), **not maximum missile range**. Full-range fuel consumption is not simulated.
- Existing radar, SAM, CIWS, ECM, chaff and AAR/Tacview paths apply. No HOJ, pop-up or weaving capability is enabled.
- Existing pre-spawned threats use simplified terminal activation and countermeasure diversion. This addition does not introduce a separate acquisition/loss state machine or claim full seeker simulation.

## Source

- [R-360 Neptune — Wikipedia](https://en.wikipedia.org/wiki/R-360_Neptune), consulted 2026-10-24 for baseline identity, dimensions, propulsion and warhead. Later extended-range/land-attack variants on that page are excluded.

Public references guide identity and appearance; RCS, burn-through, damage and interception probabilities remain game assumptions.
