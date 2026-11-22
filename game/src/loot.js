// The Gilded Hour — loot.
// One job: the things Wren steals, their values, and picking them up.
export function makeLoot(def) {
  return {
    x: def.x,
    y: def.y,
    kind: def.kind, // vase | gem | painting | hourglass
    value: def.value,
    label: def.label,
    taken: false,
    // Deterministic sparkle phase from the loot's own position.
    sparkle: ((def.x * 0.7 + def.y * 1.3) % (Math.PI * 2)),
  };
}

// Walk over loot to pocket it. Returns the value taken (0 when nothing).
export function tryPickup(lootList, thiefX, thiefY) {
  let gained = 0;
  for (const item of lootList) {
    if (item.taken) continue;
    if (Math.hypot(item.x - thiefX, item.y - thiefY) < 26) {
      item.taken = true;
      gained += item.value;
    }
  }
  return gained;
}

export function lootCollected(lootList) {
  return lootList.filter((i) => i.taken).reduce((sum, i) => sum + i.value, 0);
}

export function lootRemaining(lootList) {
  return lootList.filter((i) => !i.taken).length;
}
