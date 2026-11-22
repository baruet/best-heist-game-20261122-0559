// The Gilded Hour — keyboard and mouse input.
// One job: turn browser events into one small state object the game reads.
// Keys: WASD / arrows to move, Q smoke, E or click to throw a noise maker,
// 1/2/3 pick a planning route, Enter confirm, R restart, P pause, M mute.
export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    smokePressed: false,
    click: null, // { x, y } in canvas coordinates, consumed by the game
    key: null, // last single-press key, consumed by the game
    mouse: { x: 0, y: 0 },
  };
}

export function attachInput(input, canvas) {
  const keyMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };
  window.addEventListener('keydown', (e) => {
    if (keyMap[e.code] !== undefined) {
      input[keyMap[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ' && !e.repeat) input.smokePressed = true;
    if (!e.repeat) input.key = e.code;
  });
  window.addEventListener('keyup', (e) => {
    if (keyMap[e.code] !== undefined) input[keyMap[e.code]] = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.click = {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
    e.preventDefault();
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
  });
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}
