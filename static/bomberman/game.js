var Bomberman = (function () {
  const COLS = 15, ROWS = 15, TILE = 40; // 600/15=40px pixels maiores pra Bomberman
  var canv, ctx;
  var map = []; // 0 empty, 1 hard wall, 2 soft brick
  var player = { col: 1, row: 2, dir: 1, bombsMax: 1, flameLen: 1, invul: 0, bombCount: 0 };
  var enemies = [];
  var bombs = [];
  var flames = [];
  var powerups = []; // 0 flame, 1 bomb
  var score = 0, lives = 3, level = 1, enemiesLeft = 1;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  function initMap() {
    for (let r = 0; r < ROWS; r++) {
      map[r] = [];
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || r === ROWS-1 || c === 0 || c === COLS-1) map[r][c] = 1; // borders hard
        else if (r%2 === 1 && c%2 === 1) map[r][c] = 1; // hard cross
        else if (Math.random() < 0.7) map[r][c] = 2; // soft random
        else map[r][c] = 0;
      }
    }
    // Garantir espaço livre ao redor da posição inicial do jogador
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = 2 + dr, c = 1 + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          map[r][c] = 0;
        }
      }
    }
    // Garantir espaço livre para os inimigos
    map[2][13] = 0; // inimigo 1
    map[13][2] = 0; // inimigo 2
    map[13][13] = 0; // inimigo 3 (level 2+)
    map[1][13] = 0; // inimigo 4 (level 3+)
    player.col = 1; player.row = 2;
  }

  // Carrega os melhores recordes do servidor
  async function loadBestScores() {
    try {
      const response = await fetch('/api/recordes?game=bomberman');
      if (response.ok) {
        const serverScores = await response.json();
        bestScores = serverScores.map(record => ({
          name: record.username,
          score: record.score
        }));
        while (bestScores.length < 5) {
          bestScores.push({ name: '---', score: 0 });
        }
      } else {
        throw new Error('Falha ao carregar do servidor');
      }
    } catch (e) {
      bestScores = [
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 }
      ];
    }
    updateScoresDisplay();
  }

  function updateScoresDisplay() {
    document.querySelectorAll('.best-score').forEach((el,i) => {
      el.textContent = `${i+1}. ${bestScores[i].name} : ${bestScores[i].score}`;
    });
  }

  // Adiciona um novo recorde via API
  async function addScore(name, sc) {
    if (!name || !window.currentUser) return;
    const success = await saveBestScore(name, sc);
    if (success) {
      await loadBestScores();
    }
  }

  // Salva o recorde no servidor via API
  async function saveBestScore(name, score) {
    try {
      const response = await fetch('/api/recordes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, score: score, game: 'bomberman' })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  function reset() {
    initMap();
    player = { col: 1, row: 2, dir: 1, bombsMax: 1, flameLen: 1, invul: 0, bombCount: 0 };
    // Add more enemies based on level
    enemies = [{col:13, row:2}, {col:2, row:13}];
    if (level >= 2) enemies.push({col:13, row:13});
    if (level >= 3) enemies.push({col:1, row:13});
    bombs = []; flames = []; powerups = [];
    // Don't reset score, lives, or level
    enemiesLeft = enemies.length;
    updateHUD();
    gameRunning = true;
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('lives').textContent = `VIDAS: ${lives}`;
    document.getElementById('level').textContent = `LVL: ${level}`;
    document.getElementById('enemies').textContent = `INIM: ${enemiesLeft}`;
    document.getElementById('powers').textContent = `🔥${player.flameLen} 💣${player.bombsMax - player.bombCount}`;
  }

  function canMove(col, row, dc, dr) {
    const nc = Math.floor(col + dc), nr = Math.floor(row + dr);
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return false;
    return map[nr][nc] === 0;
  }

  function dropBomb() {
    if (player.bombCount >= player.bombsMax) return;
    const c = Math.floor(player.col), r = Math.floor(player.row);
    if (map[r][c] !== 0 || bombs.some(b => b.c === c && b.r === r)) return;
    bombs.push({c, r, timer: 180, len: player.flameLen});
    player.bombCount++;
  }

  function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.timer--;
      if (b.timer <= 0) {
        explode(b.c, b.r, b.len);
        bombs.splice(i, 1);
        player.bombCount--;
        continue;
      }
    }
  }

  function explode(c, r, len) {
    flames.push({c, r, type: 'center', life: 30});
    for (let d = 1; d <= len; d++) {
      if (map[r][c + d] !== 0) { if (map[r][c + d] === 2) map[r][c + d] = 0; break; }
      flames.push({c: c+d, r, type: 'right', life: 30});
    }
    for (let d = 1; d <= len; d++) {
      if (map[r][c - d] !== 0) { if (map[r][c - d] === 2) map[r][c - d] = 0; break; }
      flames.push({c: c-d, r, type: 'left', life: 30});
    }
    for (let d = 1; d <= len; d++) {
      if (map[r + d] && map[r + d][c] !== 0) { if (map[r + d][c] === 2) map[r + d][c] = 0; break; }
      flames.push({c, r: r+d, type: 'down', life: 30});
    }
    for (let d = 1; d <= len; d++) {
      if (map[r - d] && map[r - d][c] !== 0) { if (map[r - d][c] === 2) map[r - d][c] = 0; break; }
      flames.push({c, r: r-d, type: 'up', life: 30});
    }
  }

  function updateFlames() {
    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      f.life--;
      if (f.life <= 0) {
        flames.splice(i, 1);
        continue;
      }
      // Check player hit
      if (Math.hypot(f.c - player.col, f.r - player.row) < 0.5 && player.invul <= 0) {
        lives--;
        player.invul = 180;
        updateHUD();
        if (lives <= 0) gameOver();
      }
      // Check enemy hit
      enemies.forEach((e, ei) => {
        if (Math.hypot(f.c - e.col, f.r - e.row) < 0.5) {
          enemies.splice(ei, 1);
          enemiesLeft--;
          score += 100;
          updateHUD();
        }
      });
    }
  }

  function updatePlayer() {
    let dc = 0, dr = 0;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) { dr = -1; player.dir = 0; }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { dc = 1; player.dir = 1; }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) { dr = 1; player.dir = 2; }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dc = -1; player.dir = 3; }
    if (canMove(player.col, player.row, dc, dr)) {
      player.col += dc; player.row += dr;
    }
    if (keys[' '] && player.bombCount < player.bombsMax) {
      dropBomb();
      keys[' '] = false;
    }
    // Limpar keys de movimento após usar
    keys['ArrowUp'] = keys['w'] = keys['W'] = false;
    keys['ArrowRight'] = keys['d'] = keys['D'] = false;
    keys['ArrowDown'] = keys['s'] = keys['S'] = false;
    keys['ArrowLeft'] = keys['a'] = keys['A'] = false;
    // Check collision with enemies
    enemies.forEach(e => {
      if (Math.hypot(e.col - player.col, e.row - player.row) < 0.8 && player.invul <= 0) {
        lives--;
        player.invul = 180;
        updateHUD();
        if (lives <= 0) gameOver();
      }
    });
    // Check victory condition
    if (enemiesLeft <= 0) {
      level++;
      // Auto reset for next level
      setTimeout(() => {
        reset();
      }, 2000); // 2 second delay to show victory
    }
    player.invul = Math.max(0, player.invul - 1);
  }

  function updateEnemies() {
    enemies.forEach(e => {
      // Simple AI: move towards player, cell by cell
      if (Math.random() < 0.02) { // Move occasionally, not every frame
        const dc = player.col > e.col ? 1 : player.col < e.col ? -1 : 0;
        const dr = player.row > e.row ? 1 : player.row < e.row ? -1 : 0;
        if (dc !== 0 && canMove(e.col, e.row, dc, 0)) {
          e.col += dc;
        } else if (dr !== 0 && canMove(e.col, e.row, 0, dr)) {
          e.row += dr;
        }
      }
    });
  }

  function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      if (Math.hypot(p.c - player.col, p.r - player.row) < 0.5) {
        if (p.type === 0) player.flameLen++;
        else player.bombsMax++;
        powerups.splice(i, 1);
        updateHUD();
      }
    }
  }

  function gameOver() {
    gameRunning = false;
    document.getElementById('game-over').textContent = 'GAME OVER';
    document.getElementById('game-over').style.display = 'block';
    // Save score if user is logged in
    if (window.currentUser && score > 0) {
      addScore(window.currentUser, score);
    }
  }

  function drawMap() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const px = c * TILE, py = r * TILE;
      if (map[r][c] === 1) {
        ctx.fillStyle = '#444';
        ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
        ctx.fillStyle = '#222';
        ctx.fillRect(px+6, py+6, TILE/3, TILE/3);
        ctx.fillRect(px+TILE/2, py+TILE/2, TILE/3, TILE/3);
      } else if (map[r][c] === 2) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(px+1, py+1, TILE-2, TILE-2);
        ctx.fillStyle = '#654321';
        ctx.fillRect(px+4, py+4, TILE-8, TILE-8);
      }
    }
  }

  function drawPlayer() {
    const px = Math.floor(player.col * TILE), py = Math.floor(player.row * TILE);
    if (player.invul > 0 && Math.floor(Date.now()/100)%2) return;
    ctx.fillStyle = player.invul > 0 ? 'gold' : '#FF1493';
    ctx.fillRect(px+8, py+8, TILE-16, TILE-16);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(px+12, py+6, 6,6); ctx.fillRect(px+22, py+6, 6,6);
    let cx = px + TILE/2, cy = py + TILE/2;
    if (player.dir === 0) ctx.fillRect(cx-3, cy-12, 6,12);
    else if (player.dir === 1) ctx.fillRect(cx+12, cy-3, 12,6);
    else if (player.dir === 2) ctx.fillRect(cx-3, cy+12, 6,12);
    else ctx.fillRect(cx-12, cy-3, 12,6);
  }

  function drawEnemies() {
    enemies.forEach(e => {
      const px = Math.floor(e.col * TILE), py = Math.floor(e.row * TILE);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(px+4, py+4, TILE-8, TILE-8);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(px+8, py+2, 4,4); ctx.fillRect(px+18, py+2, 4,4);
    });
  }

  function drawBombs() {
    bombs.forEach(b => {
      const px = b.c * TILE, py = b.r * TILE;
      ctx.fillStyle = '#000';
      ctx.fillRect(px+4, py+4, TILE-8, TILE-8);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(px+8, py+8, TILE-16, TILE-16);
    });
  }

  function drawFlames() {
    flames.forEach(f => {
      const px = f.c * TILE, py = f.r * TILE;
      ctx.fillStyle = '#FFA500';
      if (f.type === 'center') ctx.fillRect(px+4, py+4, TILE-8, TILE-8);
      else if (f.type === 'up') ctx.fillRect(px+4, py, TILE-8, TILE/2);
      else if (f.type === 'down') ctx.fillRect(px+4, py+TILE/2, TILE-8, TILE/2);
      else if (f.type === 'left') ctx.fillRect(px, py+4, TILE/2, TILE-8);
      else if (f.type === 'right') ctx.fillRect(px+TILE/2, py+4, TILE/2, TILE-8);
    });
  }

  function drawPowerups() {
    powerups.forEach(p => {
      const px = p.c * TILE, py = p.r * TILE;
      ctx.fillStyle = p.type === 0 ? '#FFA500' : '#00FF00';
      ctx.fillRect(px+4, py+4, TILE-8, TILE-8);
    });
  }

  function update() {
    if (!gameRunning) return;
    updatePlayer();
    updateEnemies();
    updateBombs();
    updateFlames();
    updatePowerups();
    updateHUD();
  }

  function draw() {
    ctx.fillStyle = 'rgba(10,20,30,0.95)';
    ctx.fillRect(0,0,600,600);
    drawMap();
    drawBombs();
    drawFlames();
    drawPowerups();
    drawEnemies();
    drawPlayer();
  }

  function loop() {
    console.log('Loop executando');
    update();
    draw();
  }

  // Events
  document.addEventListener('keydown', e => {
    console.log('Tecla pressionada:', e.key);
    keys[e.key] = true;
    if (e.key === ' ') { e.preventDefault(); keys[' '] = true; }
  });
  document.addEventListener('keyup', e => keys[e.key] = false);

  var init = async function() {
    canv = document.getElementById('gc');
    ctx = canv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    await loadBestScores();
    reset();
    setInterval(loop, 1000/60); // 60 FPS
  };

  return { init };
})();

Bomberman.init();