import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCatalogRecord } from "./catalog-record.mjs";
import { pulseDopplerFactors } from "../dist-test/radar/doppler.js";
import { airRadarFactors } from "../dist-test/air/sensors.js";

const profiles=readCatalogRecord(new URL('../src/air/catalog.ts',import.meta.url),'AIR_RADAR_DOPPLER_PROFILES');
const base={sensorPosition:{x:0,y:80,z:0}, sensorVelocity:{x:3,y:0,z:0},
  targetPosition:{x:100,y:20,z:0}, targetVelocity:{x:0,y:0,z:5}};
const sensor={sensorAltitude:80,targetAltitude:20,range:100,nominalRange:500,
  targetRcs:8,radarHealth:1,precision:1};
for (const [name,profile] of Object.entries(profiles)) {
  const beam=pulseDopplerFactors(profile,base);
  assert.equal(beam.clutter,true);
  assert.equal(beam.factor,profile.minimumFactor);
  assert.equal(beam.closingRate,3,'ownship closure must not erase a ground-referenced notch');
  assert.equal(beam.clutterSeparation,0);
  for (const vx of [-5,5]) {
    const hot={...base,targetVelocity:{x:vx,y:0,z:0}};
    assert.equal(pulseDopplerFactors(profile,hot).factor,1);
    const beamSensor=airRadarFactors({...sensor,pulseDoppler:profile,dopplerObservation:base});
    const hotSensor=airRadarFactors({...sensor,pulseDoppler:profile,dopplerObservation:hot});
    assert.ok(beamSensor.probability<hotSensor.probability);
    assert.ok(beamSensor.quality<hotSensor.quality);
    assert.equal(beamSensor.effectiveRange,hotSensor.effectiveRange);
  }
  const partial=pulseDopplerFactors(profile,{...base,targetVelocity:{x:profile.notchHalfWidth/2,y:0,z:4}});
  assert.equal(partial.factor,(1+profile.minimumFactor)/2);
  for (const altitude of [80,100]) assert.equal(pulseDopplerFactors(profile,
    {...base,targetPosition:{...base.targetPosition,y:altitude}}).factor,1);
  assert.equal(pulseDopplerFactors(profile,{...base,targetPosition:{...base.sensorPosition}}).factor,1);
  assert.equal(pulseDopplerFactors(profile,{...base,targetVelocity:{x:NaN,y:0,z:0}}).factor,1);
  console.log(`${name}: beam factor ${beam.factor}, closing rate ${beam.closingRate}`);
}
// Capability absent: preserve all legacy fields bit-for-bit, regardless of motion.
assert.deepEqual(airRadarFactors(sensor),airRadarFactors({...sensor,dopplerObservation:base}));
const legacy=airRadarFactors(sensor);
assert.equal(legacy.probability,0.96-Math.pow(100/500,2)*0.7);
assert.equal(legacy.quality,(1-100/500)*0.7+0.24);
for(const profile of [{notchHalfWidth:0,minimumFactor:.25,minimumLookDownDeg:2},
  {notchHalfWidth:1,minimumFactor:NaN,minimumLookDownDeg:2}])
  assert.equal(pulseDopplerFactors(profile,base).factor,1);
const runtime=readFileSync('src/air/runtime.ts','utf8');
assert.match(runtime,/pulseDoppler: a\.definition\.sensor\.pulseDoppler/);
assert.match(runtime,/sensorPosition: a\.position, sensorVelocity: a\.velocity/);
assert.match(runtime,/targetPosition: target\.position, targetVelocity: target\.velocity/);
console.log('Catalog-gated look-down pulse-Doppler sensor regression passed');
