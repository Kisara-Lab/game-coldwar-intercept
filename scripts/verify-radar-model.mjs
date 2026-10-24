import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { radarHorizonWorldUnits, radarCrossSectionFactor, uncertaintyMetersToWorld,
  SENSOR_ALTITUDE_METERS_PER_UNIT } from "../dist-test/radar/model.js";
import { airRadarFactors } from "../dist-test/air/sensors.js";
import { CombatPicture } from "../dist-test/sim.js";

const near = (a,b) => assert.ok(Math.abs(a-b) <= Math.max(1,Math.abs(b))*1e-12, `${a} != ${b}`);
assert.equal(SENSOR_ALTITUDE_METERS_PER_UNIT, 50);
for (const scale of [0.001, 10, 25, 1e6]) {
  near(radarHorizonWorldUnits(36, 100, scale), 4.12 * scale * 16);
  near(uncertaintyMetersToWorld(1500, scale) / scale, 1.5);
  const result = airRadarFactors({sensorAltitude:20,targetAltitude:2,range:100,
    nominalRange:500,targetRcs:8,radarHealth:1,precision:1,worldUnitsPerKm:scale});
  near(result.horizon, radarHorizonWorldUnits(1000,100,scale));
}
near(radarHorizonWorldUnits(36,100), 41.2*16);
for (const rcs of [0,0.0001,0.12,0.5,5.2,8,10,145,12000,1e9]) {
  for (const [profile,ref] of [['shipSearch',0.5],['airSearch',8],['surfaceSearch',10]])
    near(radarCrossSectionFactor(rcs,profile), Math.pow(Math.max(0.05,rcs/ref),0.25));
  near(radarCrossSectionFactor(rcs,'airSeeker'),Math.max(0.32,Math.min(1.25,Math.pow(rcs/8,0.25))));
  near(radarCrossSectionFactor(rcs,'maritimeCue'),Math.max(0.22,Math.min(1,Math.pow(Math.max(0.05,rcs/12000),0.25))));
}
// Exercise the real measurement producer, not just the conversion helper. The
// same RNG/range/quality yields equal metre errors and scale-proportional offsets.
const measure = scale => {
  const picture = new CombatPicture([{name:'TEST',threeDimensional:true,baseInterval:0.1,
    maxRange:1000,radarHeight:36,precision:1}]);
  picture.setWorldScale(scale);
  const target = {id:1,position:new THREE.Vector3(20,20,0),velocity:new THREE.Vector3(),altitude:1000,rcs:10};
  picture.update(0.1,0.1,[target]);
  const track=picture.trackForTarget(1);
  assert.ok(track);
  return {meters:track.uncertainty,dx:track.position.x-target.position.x};
};
const defaultTrack=measure(10), scaledTrack=measure(25);
near(defaultTrack.meters,scaledTrack.meters);
near(defaultTrack.dx*2.5,scaledTrack.dx);
// Consumer wiring guards catch a second local formula or lost scenario argument.
for (const file of ['src/sim.ts','src/air/sensors.ts','src/platforms/runtime.ts','src/main.ts']) {
  const text=readFileSync(file,'utf8');
  assert.doesNotMatch(text,/41\.2|function radarHorizonWorldUnits/);
}
for(const [file,profile] of [['src/sim.ts','shipSearch'],['src/air/sensors.ts','airSearch'],
  ['src/air/guidance.ts','airSeeker'],['src/platforms/runtime.ts','surfaceSearch'],['src/soviet-c2/maritime-targeting.ts','maritimeCue']])
  assert.match(readFileSync(file,'utf8'),new RegExp('radarCrossSectionFactor\\([^;\\n]+"'+profile+'"\\)'));
const main=readFileSync('src/main.ts','utf8');
assert.match(main,/combatPicture\.setWorldScale\(worldUnitsPerKm\)/);
assert.match(main,/surfacePicture\.setWorldScale\(worldUnitsPerKm\)/);
assert.match(main,/uncertaintyMetersToWorld\(track\.uncertainty, worldUnitsPerKm\)/);
console.log('Radar horizon, RCS profiles and metre-valued measurement regression passed');
