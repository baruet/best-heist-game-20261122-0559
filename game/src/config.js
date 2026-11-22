// The Gilded Hour — shared constants for the whole game.
// One job: every number and colour the other files agree on lives here.
export const CANVAS_W = 960;
export const CANVAS_H = 640;
export const HUD_H = 56;
export const FIELD_W = 960;
export const FIELD_H = CANVAS_H - HUD_H; // 584
export const FIELD_Y = HUD_H;

export const THIEF_SPEED = 165; // px per second
export const THIEF_RADIUS = 11;
export const GUARD_RADIUS = 12;

export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
export const CONE_RANGE = 185;
export const CAM_CONE_RANGE = 210;
export const CAM_CONE_HALF_ANGLE = 0.5;

export const SUSPICION_RATE = 1.7; // per second while the thief is inside a cone
export const SUSPICION_DECAY = 0.55; // per second while unseen
export const ALERT_ALARM_RATE = 22; // alarm points per second while a guard is alerted
export const CAMERA_ALARM_RATE = 16; // alarm points per second while a camera sees the thief
export const ALARM_DECAY = 2.5; // alarm points per second while nobody sees the thief
export const ALARM_MAX = 100;
export const ALERT_CHASE_SECONDS = 3.0;
export const GRACE_SECONDS = 1.2; // warning time after first being spotted before alarm climbs fast

export const SMOKE_SECONDS = 4.0;
export const SMOKE_RADIUS = 72;
export const NOISE_SECONDS = 3.0;
export const NOISE_LURE_RADIUS = 280;

export const TOOL_PRICES = { smoke: 120, noise: 90 };
export const TOOL_START = { smoke: 2, noise: 2 };

// Route B's hidden bonus stash — must match the free spot checked in levels.js
// (inside no wall, inside no cover, on every room's floor).
export const ROUTE_BONUS_LOOT = { x: 440, y: 300 };

export const COLORS = {
  floorA: '#1c2733',
  floorB: '#182230',
  carpet: '#5a1f28',
  carpetEdge: '#8a6d3b',
  wall: '#0e141c',
  wallTrim: '#8a6d3b',
  cover: '#6b4f2a',
  coverTop: '#8a6d3b',
  pedestal: '#3a2f22',
  thief: '#2dd4a7',
  thiefDark: '#0f766e',
  guard: '#3b5bdb',
  guardDark: '#1e2a5e',
  coneCalm: 'rgba(245, 197, 66, 0.30)',
  coneCalmEdge: 'rgba(245, 197, 66, 0.55)',
  coneAlert: 'rgba(239, 68, 68, 0.38)',
  coneAlertEdge: 'rgba(239, 68, 68, 0.75)',
  camera: '#94a3b8',
  cameraEye: '#ef4444',
  loot: '#f5c542',
  lootGlow: 'rgba(245, 197, 66, 0.45)',
  exit: '#22c55e',
  exitGlow: 'rgba(34, 197, 94, 0.35)',
  smoke: 'rgba(203, 213, 225, 0.55)',
  hudBg: '#0b0f16',
  hudText: '#e8dcc0',
  hudGold: '#f5c542',
  alarmLow: '#22c55e',
  alarmMid: '#f59e0b',
  alarmHigh: '#ef4444',
  title: '#f5c542',
  panel: '#141c28',
  panelEdge: '#8a6d3b',
};

export const GAME_NAME = 'THE GILDED HOUR';
export const GALLERY_NAME = 'Velmora Gallery of Hours';
export const THIEF_NAME = 'Wren';
