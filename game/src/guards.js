// The Gilded Hour — guard behaviour.
// One job: move a guard along its patrol, grow suspicion when it sees the
// thief, chase briefly when alerted, and walk over to investigate a noise.
import { GUARD_RADIUS, SUSPICION_RATE, SUSPICION_DECAY, ALERT_CHASE_SECONDS, NOISE_LURE_RADIUS } from './config.js';
import { guardCanSee, angleDiff } from './cones.js';

export function makeGuard(def, speedMul) {
  const start = def.waypoints[0];
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    speed: def.speed * speedMul,
    waypoints: def.waypoints,
    wait: def.wait,
    // A one-stop guard stands its post; a longer patrol starts at stop 1.
    wpIndex: def.waypoints.length > 1 ? 1 : 0,
    waitLeft: 0,
    suspicion: 0,
    state: 'patrol', // patrol | suspicious | alert | investigate
    alertLeft: 0,
    investigateTarget: null,
    investigateLeft: 0,
    lastSeen: null,
    lookTimer: 0,
  };
}

function moveToward(g, tx, ty, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const step = Math.min(d, g.speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  g.facing = Math.atan2(dy, dx);
  return d - step < 2;
}

export function updateGuard(g, dt, thief, solids, smokes, now) {
  const hidden = smokes.length > 0 && smokes.some((s) => Math.hypot(thief.x - s.x, thief.y - s.y) <= s.radius);
  const sees = !hidden && !thief.hidden && guardCanSee(g, thief.x, thief.y, solids);

  if (sees) {
    g.suspicion = Math.min(1, g.suspicion + SUSPICION_RATE * dt);
    g.lastSeen = { x: thief.x, y: thief.y };
    if (g.suspicion >= 1 && g.state !== 'alert') {
      g.state = 'alert';
      g.alertLeft = ALERT_CHASE_SECONDS;
    } else if (g.suspicion > 0.35 && g.state === 'patrol') {
      g.state = 'suspicious';
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - SUSPICION_DECAY * dt);
    if (g.state === 'suspicious' && g.suspicion <= 0.05) g.state = 'patrol';
  }

  if (g.state === 'alert') {
    g.alertLeft -= dt;
    const target = g.lastSeen || { x: g.x, y: g.y };
    const arrived = moveToward(g, target.x, target.y, dt * 1.55);
    if (g.alertLeft <= 0 || (arrived && !sees)) {
      g.state = 'patrol';
      g.suspicion = Math.max(0.2, g.suspicion - 0.4);
    }
    return;
  }

  if (g.state === 'investigate') {
    if (g.investigateTarget) {
      const arrived = moveToward(g, g.investigateTarget.x, g.investigateTarget.y, dt * 1.25);
      if (arrived) {
        g.investigateLeft -= dt;
        g.facing += dt * 1.6; // look around the spot
        if (g.investigateLeft <= 0) {
          g.state = 'patrol';
          g.investigateTarget = null;
        }
      }
    } else {
      g.state = 'patrol';
    }
    return;
  }

  if (g.state === 'suspicious') {
    // Freeze and stare at the last seen spot: the fair warning.
    if (g.lastSeen) g.facing = Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x);
    g.lookTimer += dt;
    if (g.lookTimer > 1.4 && !sees) {
      g.lookTimer = 0;
      g.state = 'patrol';
    }
    return;
  }

  // Patrol: walk the waypoint loop, pausing at each stop.
  if (g.waitLeft > 0) {
    g.waitLeft -= dt;
    if (g.waitLeft <= 0) g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    return;
  }
  const wp = g.waypoints[g.wpIndex];
  const arrived = moveToward(g, wp.x, wp.y, dt);
  if (arrived) g.waitLeft = g.wait;
}

// A noise maker pulls every guard in earshot to the beep.
export function lureGuards(guards, x, y, radius = NOISE_LURE_RADIUS) {
  for (const g of guards) {
    if (g.state === 'alert') continue;
    if (Math.hypot(g.x - x, g.y - y) <= radius) {
      g.state = 'investigate';
      g.investigateTarget = { x, y };
      g.investigateLeft = 2.0;
      g.suspicion = Math.max(0, g.suspicion - 0.3);
    }
  }
}

export function guardRadius() {
  return GUARD_RADIUS;
}
