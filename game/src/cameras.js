// The Gilded Hour — wall cameras.
// One job: sweep a fixed camera back and forth and say when it sees the thief.
import { cameraCanSee } from './cones.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    angle: def.baseAngle,
    seesThief: false,
  };
}

export function updateCamera(cam, t, thief, solids, smokes) {
  cam.angle = cam.baseAngle + Math.sin(t * cam.speed) * cam.sweep;
  const hidden = smokes.some((s) => Math.hypot(thief.x - s.x, thief.y - s.y) <= s.radius);
  cam.seesThief = !hidden && !thief.hidden && cameraCanSee(cam, thief.x, thief.y, solids);
  return cam.seesThief;
}
