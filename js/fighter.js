// Võ Đài Việt — class Fighter: state machine, vật lý, vẽ sprite
class Fighter {
  constructor(charId, x, facing) {
    const c = CHARACTERS[charId];
    this.char = c;
    this.x = x;
    this.y = 0;               // độ cao so với mặt đất (0 = đứng trên đất)
    this.vy = 0;
    this.facing = facing;     // 1 = nhìn phải, -1 = nhìn trái
    this.state = 'idle';
    this.stateTime = 0;       // số frame ở state hiện tại
    this.hp = c.hp;
    this.maxHp = c.hp;
    this.energy = 0;          // 0-100
    this.sprites = {};        // cache Image
    this.animTime = 0;
    this.onGround = true;
    this.GROUND_Y = 460;      // mặt đất trong canvas 960x540
  }

  loadSprites(done) {
    const files = new Set();
    for (const k of Object.keys(this.char.sprites))
      for (const f of this.char.sprites[k]) files.add(f);
    let loaded = 0;
    const total = files.size;
    files.forEach(f => {
      const img = new Image();
      img.onload = () => { if (++loaded === total) done(); };
      img.onerror = () => { if (++loaded === total) done(); };
      img.src = 'assets/sprites/' + f + '?v=3';
      this.sprites[f] = img;
    });
    if (total === 0) done();
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.stateTime = 0;
    this.animTime = 0;
  }

  // frame data: [tổng frame, frame gây sát thương (nếu có)]
  static ATTACK_DATA = {
    punch: { total: 14, hitFrame: 6 },
    kick:  { total: 20, hitFrame: 10 },
    special:{ total: 28, hitFrame: 14 },
  };

  update(inp, opponent) {
    this.stateTime++;
    this.animTime++;

    const canAct = ['idle', 'walk'].includes(this.state);

    // --- di chuyển ---
    if (canAct) {
      let moving = false;
      // đi tới/lùi theo hướng nhìn
      const fwd = this.facing === 1 ? inp.right() : inp.left();
      const back = this.facing === 1 ? inp.left() : inp.right();
      if (fwd)  { this.x += this.char.walkSpeed; moving = true; }
      if (back) { this.x -= this.char.walkSpeed * 0.8; moving = true; }
      this.setState(moving ? 'walk' : 'idle');

      // nhảy
      if (inp.up() && this.onGround) {
        this.vy = -this.char.jumpPower;
        this.onGround = false;
        this.setState('jump');
      }
      // đỡ
      if (inp.down() || inp.block()) this.setState('block');
      // đánh
      else if (inp.punch()) this.setState('punch');
      else if (inp.kick()) this.setState('kick');
      else if (inp.special() && this.energy >= 100) {
        this.energy = 0;
        this.setState('special');
      }
    }

    // --- vật lý nhảy ---
    if (!this.onGround) {
      this.y += this.vy;
      this.vy += 0.6; // trọng lực
      if (this.y >= 0) { this.y = 0; this.vy = 0; this.onGround = true; if (this.state === 'jump') this.setState('idle'); }
    }

    // --- kết thúc đòn đánh → về idle ---
    const atk = Fighter.ATTACK_DATA[this.state];
    if (atk && this.stateTime >= atk.total) this.setState('idle');
    // hết choáng → về idle
    if (this.state === 'hit' && this.stateTime >= 18) this.setState('idle');
    // thả nút đỡ → về idle
    if (this.state === 'block' && !inp.down() && !inp.block()) this.setState('idle');

    // --- giới hạn sàn đấu ---
    this.x = Math.max(60, Math.min(900, this.x));

    // --- quay mặt về đối thủ ---
    if (canAct && opponent) this.facing = opponent.x >= this.x ? 1 : -1;
  }

  currentSprite() {
    const map = { idle: 'idle', walk: 'walk', jump: 'jump', punch: 'punch', kick: 'kick', special: 'punch', block: 'block', hit: 'hit', ko: 'hit' };
    const key = map[this.state] || 'idle';
    const frames = this.char.sprites[key] || this.char.sprites.idle;
    // idle/walk nhấp nháy 2 frame mỗi 20 frame
    const idx = frames.length > 1 ? Math.floor(this.animTime / 20) % frames.length : 0;
    // đòn đánh: frame 1 khi tung đòn, frame 2 khi thu về
    if ((this.state === 'punch' || this.state === 'kick' || this.state === 'special') && frames.length > 1) {
      const atk = Fighter.ATTACK_DATA[this.state];
      return this.sprites[frames[this.stateTime >= atk.hitFrame ? 1 : 0]];
    }
    return this.sprites[frames[idx]];
  }

  draw(ctx) {
    const img = this.currentSprite();
    const drawY = this.GROUND_Y - this.y;
    if (!img || !img.complete || img.naturalWidth === 0) {
      // sprite tạm: hình chữ nhật
      ctx.fillStyle = this.facing === 1 ? '#4FC3F7' : '#EF5350';
      ctx.fillRect(this.x - 30, drawY - 160, 60, 160);
      return;
    }
    const w = 140, h = 180;
    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.scale(this.facing, 1);
    // KO: xoay nghiêng
    if (this.state === 'ko') ctx.rotate(-0.4);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }

  // hurtbox: vùng bị đánh
  hurtbox() {
    const drawY = this.GROUND_Y - this.y;
    return { x: this.x - 35, y: drawY - 170, w: 70, h: 170 };
  }

  // hitbox: vùng gây sát thương khi ra đòn
  hitbox() {
    const atk = Fighter.ATTACK_DATA[this.state];
    if (!atk || this.stateTime !== atk.hitFrame) return null;
    const drawY = this.GROUND_Y - this.y;
    const reach = this.state === 'kick' ? 95 : 80;
    const x = this.facing === 1 ? this.x + 20 : this.x - 20 - reach;
    return { x, y: drawY - 140, w: reach, h: 70 };
  }
}
