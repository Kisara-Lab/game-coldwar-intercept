import assert from "node:assert/strict";
import * as THREE from "three";
import { ConflictTrackFusionRuntime } from "../dist-test/tracks/conflict-fusion.js";
import { tacticalRadarFrameForShip } from "../dist-test/visual/tactical-radar-ship-adapter.js";
import { buildForcePicture } from "../dist-test/fleet/force-picture.js";
import { ShipSensorRuntime } from "../dist-test/ships/sensor-runtime.js";
import { uncertaintyWorldToMeters, uncertaintyMetersToWorld } from "../dist-test/radar/model.js";
const track=(id,x)=>({targetId:id,position:new THREE.Vector3(x,0,0),velocity:new THREE.Vector3(),
  quality:.8,uncertainty:1000,classification:'aircraft',source:'local-radar',updatedAt:0,weaponQuality:true});
const reports=x=>[{track:track('a',0),contributor:'ship-a'}, {track:track('b',x),contributor:'ship-b'}];
for(const scale of [10,25]) {
  const fusion=new ConflictTrackFusionRuntime();
  const fused=fusion.fuse(reports(40*scale/10),0,scale);
  assert.equal(fusion.drainEvents()[0]?.kind,'conflict-detected');
  assert.equal([...fused.values()][0].uncertainty,2200,'conflict inflation must return to metres');
  assert.equal(uncertaintyWorldToMeters(uncertaintyMetersToWorld(1500,scale),scale),1500);
  const ship={id:'owner',alive:true,position:new THREE.Vector3(),heading:0,
    definition:{name:'Test',subsystemLabels:{primaryRadar:'Radar'}},
    localTracks:new Map([['a',track('a',0)]]),networkTracks:new Map()};
  const force={worldUnitsPerKm:scale,ships:new Map([['owner',ship]]),shipComms:new Map(),datalinkEra:'test'};
  const frame=tacticalRadarFrameForShip(force,'owner',0);
  assert.equal(frame.tracks[0].uncertaintyWorld,scale,'1000 metre radius must be one kilometre on radar');
  ship.networkTracks.set('b',track('b',40));
  const fleetFusion=new ConflictTrackFusionRuntime();
  const result=buildForcePicture(force,0,fleetFusion);
  // Association accepts separation <= 2.4 * gate. Both scales therefore merge
  // into one entry, but scale 10 exceeds its inner 20-unit agreement gate and
  // degrades quality; scale 25 is within its 50-unit gate and confirms quality.
  assert.equal(result.size,1);
  assert.deepEqual(fleetFusion.drainEvents().map(event=>event.kind),scale===10?['conflict-detected']:[]);
  assert.equal([...result.values()][0].quality,scale===10?.8*.88:.8+.8*.12);
  // Real ship sensor projection: active measurements remain metres and passive
  // observations cross the world-unit boundary before entering the same table.
  const sensorShip={...ship,side:'blue',emconMode:'active',nextPassiveScan:Infinity,
    passiveTracks:new Map(),localTracks:new Map(),subsystemHealth:new Map([['primaryRadar',100]]),
    definition:{...ship.definition,sensors:[{name:'TEST',threeDimensional:true,
      baseInterval:.1,maxRange:1000,radarHeight:36,precision:1}]}};
  const sensors=new ShipSensorRuntime();
  const entity={id:'target',side:'red',kind:'aircraft',alive:true,
    position:new THREE.Vector3(20,20,0),velocity:new THREE.Vector3(),radarCrossSection:10};
  sensors.update(sensorShip,.1,.1,[{entity,altitudeMeters:1000}],undefined,scale);
  const active=sensorShip.localTracks.get('target');
  assert.ok(active?.uncertainty>100,'organic error is stored in metres');
  sensorShip.emconMode='passive-only';
  sensorShip.passiveTracks.set('passive',{position:new THREE.Vector3(),velocity:new THREE.Vector3(),
    quality:.5,uncertainty:5,classification:'aircraft',source:'esm',lastUpdate:.1});
  sensors.update(sensorShip,.2,.1,[],undefined,scale);
  assert.equal(sensorShip.localTracks.get('passive').uncertainty,5000/scale);
}
console.log('Fleet metre uncertainty, radar projection and scenario-scale fusion passed');
