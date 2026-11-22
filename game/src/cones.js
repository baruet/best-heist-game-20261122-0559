// The Gilded Hour — vision cones and line of sight.
// One job: answer "can this watcher see that point?" and describe the cone.
import { CONE_HALF_ANGLE, CONE_RANGE, CAM_CONE_HALF_ANGLE, CAM_CONE_RANGE } from './config.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// True when the segment from (x0,y0) to (x1,y1) crosses any solid rect.
// Sampled every 6 px: cheap, and exact enough for a 2D canvas game.
export function segmentBlocked(x0, y0, x1, y1, solids) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (const s of solids) {
      if (pointInRect(px, py, s)) return true;
    }
  }
  return false;
}

// A guard's cone: range + half-angle from config.js.
export function guardCanSee(guard, tx, ty, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  if (dist < 14) return true;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.facing)) > CONE_HALF_ANGLE) return false;
  return !segmentBlocked(guard.x, guard.y, tx, ty, solids);
}

// A camera's cone: wider range, narrower angle.
export function cameraCanSee(camera, tx, ty, solids) {
  const dx = tx - camera.x;
  const dy = ty - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAM_CONE_RANGE) return false;
  if (dist < 14) return true;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, camera.angle)) > CAM_CONE_HALF_ANGLE) return false;
  return !segmentBlocked(camera.x, camera.y, tx, ty, solids);
}

// Is the thief hidden inside a smoke cloud?
export function insideSmoke(x, y, smokes) {
  for (const s of smokes) {
    if (Math.hypot(x - s.x, y - s.y) <= s.radius) return true;
  }
  return false;
}

// Cone polygon points for drawing (fan from the watcher, clipped by range).
export function conePolygon(x, y, facing, halfAngle, range, steps = 14) {
  const pts = [{ x, y }];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    pts.push({ x: x + Math.cos(a) * range, y: y + Math.sin(a) * range });
  }
  return pts;
}
