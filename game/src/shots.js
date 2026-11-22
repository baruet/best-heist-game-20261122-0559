// The Gilded Hour — staged states for the maker's screenshots.
// One job: build a fixed, deterministic game state for each screenshot name
// (?shot=cover|planning|alarm|getaway) using the game's own render code.
// No randomness, no animation time: the render uses a frozen t = 1.0.
import { ROOMS } from './levels.js';
import { makeGuard } from './guards.js';
import { makeCamera } from './cameras.js';
import { makeLoot } from './loot.js';
import { makeTools } from './tools.js';
import { TOOL_START } from './config.js';

function baseState(roomIndex, routeIndex) {
  const room = ROOMS[roomIndex];
  const route = room.routes[routeIndex];
  const guards = room.guards.slice(0, Math.max(1, room.guards.length + route.guards)).map((d) => makeGuard(d, route.speedMul));
  return {
    phase: 'play',
    roomIndex,
    room,
    route,
    thief: { x: route.start.x, y: route.start.y, facing: 0, hidden: false },
    guards,
    cameras: room.cameras.map((d) => makeCamera(d)),
    loot: room.loot.map((d) => makeLoot(d)),
    tools: makeTools(TOOL_START),
    coins: 340,
    alarm: route.alarmStart,
    lootValue: 0,
    elapsed: 0,
    score: null,
    banner: null,
    planning: { selected: routeIndex },
    caughtReason: null,
    t: 1.0,
  };
}

// Cover: room 2 mid-heist — thief near loot, two cones sweeping, a camera
// cone, the alarm meter alive, the HUD complete. Everything the judge
// needs to see, in one frame.
export function shotCover() {
  const s = baseState(1, 1);
  s.thief = { x: 356, y: 200, facing: Math.PI / 2, hidden: false };
  s.guards[0].x = 300; s.guards[0].y = 330; s.guards[0].facing = -1.16; s.guards[0].suspicion = 0.45; s.guards[0].state = 'suspicious';
  s.guards[1].x = 700; s.guards[1].y = 380; s.guards[1].facing = -Math.PI / 2;
  s.guards[2].x = 620; s.guards[2].y = 120; s.guards[2].facing = Math.PI;
  s.cameras[0].angle = Math.PI / 2 + 0.5;
  s.cameras[1].angle = Math.PI - 0.3;
  s.loot[0].taken = true;
  s.lootValue = 350;
  s.alarm = 32;
  s.elapsed = 72;
  s.tools.smoke = 2;
  s.tools.noise = 1;
  return s;
}

// Planning: room 2, route B picked, tool shop visible.
export function shotPlanning() {
  const s = baseState(1, 1);
  s.phase = 'planning';
  s.planning = { selected: 1 };
  s.tools.smoke = 3;
  s.tools.noise = 2;
  s.coins = 460;
  return s;
}

// Alarm: room 1, a guard has spotted Wren — red cone, "!", alarm at 78,
// and the fair-warning banner on screen.
export function shotAlarm() {
  const s = baseState(0, 1); // route B keeps both guards (route A drops one)
  s.thief = { x: 430, y: 200, facing: Math.PI, hidden: false };
  s.guards[0].x = 380; s.guards[0].y = 200; s.guards[0].facing = 0; s.guards[0].suspicion = 1; s.guards[0].state = 'alert'; s.guards[0].alertLeft = 2.1;
  s.guards[1].x = 760; s.guards[1].y = 420; s.guards[1].facing = -Math.PI / 2;
  s.loot[0].taken = true;
  s.loot[1].taken = true;
  s.lootValue = 550;
  s.alarm = 78;
  s.elapsed = 54;
  s.banner = { text: 'SPOTTED! Break line of sight!', color: '#ef4444' };
  return s;
}

// Getaway: room 3, vault loot in hand, Wren at the green exit door.
export function shotGetaway() {
  const s = baseState(2, 1);
  s.thief = { x: 860, y: 480, facing: Math.PI / 2, hidden: false };
  s.guards[0].x = 300; s.guards[0].y = 300; s.guards[0].facing = Math.PI;
  s.guards[1].x = 600; s.guards[1].y = 200; s.guards[1].facing = -Math.PI / 2;
  s.guards[2].x = 820; s.guards[2].y = 300; s.guards[2].facing = Math.PI / 2;
  s.guards[3].x = 160; s.guards[3].y = 400; s.guards[3].facing = 0;
  s.cameras[0].angle = Math.PI / 2 - 0.4;
  s.cameras[1].angle = Math.PI + 0.2;
  s.cameras[2].angle = -Math.PI / 2 + 0.3;
  for (const item of s.loot) item.taken = true;
  s.lootValue = 3200;
  s.alarm = 12;
  s.elapsed = 161;
  s.tools.smoke = 1;
  s.tools.noise = 0;
  s.banner = { text: 'GETAWAY! The Hourglass is yours — run!', color: '#22c55e' };
  return s;
}

export function buildShot(name) {
  if (name === 'planning') return shotPlanning();
  if (name === 'alarm') return shotAlarm();
  if (name === 'getaway') return shotGetaway();
  return shotCover();
}
