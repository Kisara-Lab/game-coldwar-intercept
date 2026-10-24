# Type 80 Air-to-Ship Missile / ASM-1

> Current main · Unreleased. Baseline Type 80; no ASM-2/ASM-3 capability.

[Weapons](README.md) · [Parameters](MISSILE_PARAMETERS.md) · [中文](../../WEAPONS/ASM1_TYPE80.md)

## Public reference and appearance

Japanese subsonic air-launched anti-ship missile with solid-rocket propulsion, inertial navigation and terminal active radar guidance. Public figures are approximately 4 m length, .35 m diameter, 1.2 m span, a 150 kg warhead and 50 km range. Its separate asset has a pointed radome, longer swept cruciform wings and a rocket nozzle, **without an air-breathing engine intake**.

## Game implementation

![ASM-1 procedural-asset inspection](../../../verification-threat-asm-1-ultra.png)

- Stable ID: `ASM-1`; definition: `src/threats/asm1.ts`.
- Select `ASM-1 RAID` or an `in-flight` scenario wave. This represents an already released missile: no F-1 carrier or nonhistorical A-6E loadout is added.
- Cruise/terminal altitude: `.4 / .14`; speed: `5.8 / 6.4`; damage: `18`; RCS: `.13`. The shared incoming flight model does not simulate a full rocket thrust/coast curve.
- Default spawn distance `360` world units is not real-world maximum range.
- Existing detection, SAM/CIWS, ECM, chaff and AAR/Tacview paths apply; no HOJ, pop-up or weaving. Pre-spawned threats retain simplified terminal activation and countermeasure diversion, without a new independent acquisition/loss state machine.

## Sources

- [80式空射反舰导弹 — Chinese Wikipedia](https://zh.wikipedia.org/wiki/80式空射反舰导弹).
- [Type 80 Air-to-Ship Missile — Wikipedia](https://en.wikipedia.org/wiki/Type_80_Air-to-Ship_Missile), consulted 2026-10-24 for baseline dimensions, propulsion, guidance and warhead. Game RCS, damage and probabilities remain assumptions.
