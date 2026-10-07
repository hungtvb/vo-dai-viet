// Võ Đài Việt — đọc input bàn phím + cảm ứng
const Input = {
  keys: {},
  // trạng thái nút ảo mobile
  touch: { left: false, right: false, up: false, down: false, punch: false, kick: false, block: false, special: false },

  init() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  },

  // gộp phím + touch thành 1 interface
  left()  { return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touch.left; },
  right() { return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.right; },
  up()    { return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touch.up; },
  down()  { return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touch.down; },
  punch() { return this.keys['KeyJ'] || this.touch.punch; },
  kick()  { return this.keys['KeyK'] || this.touch.kick; },
  block() { return this.keys['KeyS'] || this.keys['ArrowDown'] || this.touch.block; },
  special(){ return this.keys['KeyL'] || this.touch.special; },
};
