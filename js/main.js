// Võ Đài Việt — game loop chính (Phase 1: 1 võ sĩ di chuyển test)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

Input.init();

const player = new Fighter('ti', 300, 1);
const dummy = new Fighter('thayba', 660, -1);

let last = performance.now();
let fps = 60;
let started = false;

function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  fps = fps * 0.95 + (1000 / Math.max(1, dt)) * 0.05;

  player.update(Input, dummy);
  dummy.stateTime++;

  // render
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(0, 460, 960, 80);
  ctx.fillStyle = '#55557a';
  ctx.fillRect(0, 460, 960, 4);

  dummy.draw(ctx);
  player.draw(ctx);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`FPS: ${fps.toFixed(0)}  State: ${player.state}  x: ${player.x.toFixed(0)}`, 10, 20);
  ctx.fillText('A/D di chuyen, W nhay, J dam, K da, S do', 10, 40);

  requestAnimationFrame(loop);
}

function start() {
  if (started) return;
  started = true;
  last = performance.now();
  requestAnimationFrame(loop);
}

// thử load sprite, timeout 3s thì chạy luôn (dùng hình chữ nhật tạm)
let done = 0;
function oneDone() { if (++done === 2) start(); }
player.loadSprites(oneDone);
dummy.loadSprites(oneDone);
setTimeout(start, 3000);
