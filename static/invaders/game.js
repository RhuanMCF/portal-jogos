var InvadersGame;

(function () {
  const COLS = 15, ROWS = 15, TILE = 40;
  var canv, ctx;
  var ship = { x: 7, y: 14 };
  var bullets = [];
  var aliens = [];
  var alienDir = 1, alienDrop = 0;
  var score = 0, lives = 3, wave = 1;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  async function loadBestScores() {
    if (window.currentUser) {
      try {
        const response = await fetch('/api/recordes?game=invaders');
        const data = await response.json();
        bestScores = data.scores.map(s => ({name: s.username, score: s.score}));
      } catch (e) {
        console.error('Erro ao carregar recordes:', e);
        bestScores = Array(5).fill({name:'---',score:0});
      }
    } else {
      try {
        const saved = localStorage.getItem('invadersBestScores');
        bestScores = saved ? JSON.parse(saved) : Array(5).fill({name:'---',score:0});
      } catch { bestScores = Array(5).fill({name:'---',score:0}); }
    }
    updateScoresDisplay();
  }

  function saveBestScores() {
    if (!window.currentUser) {
      try { localStorage.setItem('invadersBestScores', JSON.stringify(bestScores)); } catch(e) {}
    }
  }

  function updateScoresDisplay() {
    document.querySelectorAll('.best-score').forEach((el,i) => {
      el.textContent = `${i+1}. ${bestScores[i]?.name || '---'} : ${bestScores[i]?.score || 0}`;
    });
  }

  function addScore(name, sc) {
    bestScores.push({name, score:sc});
    bestScores.sort((a,b)=>b.score - a.score).splice(5);
    saveBestScores();
    updateScoresDisplay();
  }

  function reset() {
    ship.x = 7; ship.y = 14;
    bullets = [];
    initAliens();
    score = 0; lives = 3; wave = 1; alienDir = 1; alienDrop = 0;
    gameRunning = true;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('lives').textContent = `VIDAS: ${lives}`;
    document.getElementById('wave').textContent = `ONDA: ${wave}`;
  }

  function initAliens() {
    aliens = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        aliens.push({
          x: 2 + col,
          y: 2 + row,
          alive: true,
          type: row % 3
        });
      }
    }
  }

  function update() {
    if (!gameRunning) return;

    // Move aliens
    let edge = false;
    aliens.forEach(alien => {
      if (!alien.alive) return;
      alien.x += alienDir;
      if (alien.x <= 0 || alien.x >= COLS - 1) edge = true;
    });

    if (edge) {
      alienDir = -alienDir;
      alienDrop++;
      aliens.forEach(alien => {
        if (alien.alive) alien.y++;
      });
    }

    // Alien shooting
    if (Math.random() < 0.02) {
      const aliveAliens = aliens.filter(a => a.alive);
      if (aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        bullets.push({ x: shooter.x, y: shooter.y + 1, vy: 1, player: false });
      }
    }

    // Move bullets
    bullets.forEach((bullet, i) => {
      bullet.y += bullet.vy;
      if (bullet.y < 0 || bullet.y > ROWS) {
        bullets.splice(i, 1);
        return;
      }

      // Bullet collisions
      if (bullet.player) {
        // Player bullet hits alien
        aliens.forEach(alien => {
          if (alien.alive && alien.x === bullet.x && alien.y === bullet.y) {
            alien.alive = false;
            bullets.splice(i, 1);
            score += 10 * (3 - alien.type);
          }
        });
      } else {
        // Alien bullet hits player
        if (bullet.x === ship.x && bullet.y === ship.y) {
          lives--;
          bullets.splice(i, 1);
          if (lives <= 0) gameOver();
        }
      }
    });

    // Check win condition
    if (aliens.every(a => !a.alive)) {
      wave++;
      initAliens();
      alienDrop = 0;
    }

    // Check lose condition (aliens reach bottom)
    if (aliens.some(a => a.alive && a.y >= ship.y)) {
      gameOver();
    }

    updateHUD();
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 600);

    // Draw aliens
    aliens.forEach(alien => {
      if (!alien.alive) return;
      const colors = ['#FF0000', '#FFFF00', '#00FF00'];
      ctx.fillStyle = colors[alien.type];
      ctx.fillRect(alien.x * TILE + 5, alien.y * TILE + 5, TILE - 10, TILE - 10);
    });

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.player ? '#FFFFFF' : '#FFFF00';
      ctx.fillRect(bullet.x * TILE + TILE/2 - 2, bullet.y * TILE, 4, 8);
    });

    // Draw ship
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(ship.x * TILE + 5, ship.y * TILE + 5, TILE - 10, TILE - 10);
    // Ship details
    ctx.fillStyle = '#008888';
    ctx.fillRect(ship.x * TILE + 10, ship.y * TILE + 10, TILE - 20, TILE - 20);
  }

  function gameOver() {
    gameRunning = false;
    const goEl = document.getElementById('game-over');
    goEl.innerHTML = `GAME OVER! Score: ${score} | <button onclick="InvadersGame.saveHigh()">💾 Salvar Record</button>`;
    goEl.style.display = 'block';
  }

  // Handle input
  function handleInput() {
    if (keys['ArrowLeft'] && ship.x > 0) ship.x--;
    if (keys['ArrowRight'] && ship.x < COLS - 1) ship.x++;
    if (keys[' '] && bullets.filter(b => b.player).length < 3) {
      bullets.push({ x: ship.x, y: ship.y - 1, vy: -1, player: true });
      keys[' '] = false;
    }
  }

  function loop() {
    handleInput();
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Events
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
  });
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  window.InvadersGame = {
    init: function() {
      canv = document.getElementById('gc');
      ctx = canv.getContext('2d');
      loadBestScores();
      reset();
      document.getElementById('reset').onclick = reset;
      loop();
    },
    saveHigh: async function() {
      if (window.currentUser) {
        try {
          const response = await fetch('/api/recordes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: window.currentUser, score: score, game: 'invaders'})
          });
          if (response.ok) {
            alert('Recorde salvo! 🏆');
            loadBestScores();
          } else {
            alert('Erro ao salvar recorde.');
          }
        } catch (e) {
          alert('Erro ao salvar recorde.');
        }
      } else {
        const name = prompt('Nome pro recorde:');
        if (name && name.trim()) {
          const cleanName = name.trim();
          const userBest = bestScores.filter(r => r.name === cleanName).reduce((max, r) => Math.max(max, r.score), 0);
          if (score <= userBest && userBest > 0) {
            const funny = ["🚀 Aliens invadiram seu recorde! Tenta de novo! 👾", "😅 Naves te cercaram! 💪", "💥 Game over galáctico! 🔄"];
            alert(funny[Math.floor(Math.random()*funny.length)]);
            return;
          }
          addScore(cleanName, score);
          alert('Recorde salvo! 🏆');
        }
      }
    }
  };

  InvadersGame = window.InvadersGame;
})();