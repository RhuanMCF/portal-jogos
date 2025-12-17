var FroggerGame;

(function () {
  const COLS = 15, ROWS = 15, TILE = 40;
  var canv, ctx;
  var frog = { x: 7, y: 14 };
  var logs = [], cars = [];
  var score = 0, lives = 3, level = 1;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  async function loadBestScores() {
    if (window.currentUser) {
      try {
        const response = await fetch('/api/recordes?game=frogger');
        const data = await response.json();
        bestScores = data.scores.map(s => ({name: s.username, score: s.score}));
      } catch (e) {
        console.error('Erro ao carregar recordes:', e);
        bestScores = Array(5).fill({name:'---',score:0});
      }
    } else {
      try {
        const saved = localStorage.getItem('froggerBestScores');
        bestScores = saved ? JSON.parse(saved) : Array(5).fill({name:'---',score:0});
      } catch { bestScores = Array(5).fill({name:'---',score:0}); }
    }
    updateScoresDisplay();
  }

  function saveBestScores() {
    if (!window.currentUser) {
      try { localStorage.setItem('froggerBestScores', JSON.stringify(bestScores)); } catch(e) {}
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
    frog.x = 7; frog.y = 14;
    logs = []; cars = [];
    initObjects();
    score = 0; lives = 3; level = 1;
    gameRunning = true;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('lives').textContent = `VIDAS: ${lives}`;
    document.getElementById('level').textContent = `LVL: ${level}`;
  }

  function initObjects() {
    logs = [];
    cars = [];

    // Logs in water rows
    for (let row = 2; row <= 6; row++) {
      const speed = (row % 2 === 0 ? 1 : -1) * (0.5 + level * 0.1);
      const length = 3 + Math.floor(Math.random() * 3);
      logs.push({
        x: row % 2 === 0 ? -length : COLS,
        y: row,
        length: length,
        speed: speed,
        color: '#8B4513'
      });
    }

    // Cars in road rows
    for (let row = 9; row <= 13; row++) {
      const speed = (row % 2 === 0 ? -1 : 1) * (1 + level * 0.2);
      cars.push({
        x: row % 2 === 0 ? COLS : -2,
        y: row,
        width: 2,
        speed: speed,
        color: ['#FF0000', '#FFFF00', '#0000FF', '#FF00FF'][Math.floor(Math.random() * 4)]
      });
    }
  }

  function update() {
    if (!gameRunning) return;

    // Move logs
    logs.forEach(log => {
      log.x += log.speed;
      if (log.x > COLS) log.x = -log.length;
      if (log.x < -log.length) log.x = COLS;
    });

    // Move cars
    cars.forEach(car => {
      car.x += car.speed;
      if (car.x > COLS) car.x = -car.width;
      if (car.x < -car.width) car.x = COLS;
    });

    // Move frog with logs
    const frogLog = logs.find(log =>
      frog.y === log.y &&
      frog.x >= log.x && frog.x < log.x + log.length
    );
    if (frogLog) {
      frog.x += frogLog.speed;
    }

    // Check collisions
    // Water collision (no log)
    if (frog.y >= 2 && frog.y <= 6 && !frogLog) {
      lives--;
      frog.x = 7; frog.y = 14;
      if (lives <= 0) gameOver();
      return;
    }

    // Car collision
    const hitCar = cars.find(car =>
      frog.y === car.y &&
      frog.x >= car.x && frog.x < car.x + car.width
    );
    if (hitCar) {
      lives--;
      frog.x = 7; frog.y = 14;
      if (lives <= 0) gameOver();
      return;
    }

    // Win condition
    if (frog.y === 1) {
      score += 100 * level;
      level++;
      frog.x = 7; frog.y = 14;
      initObjects();
    }

    updateHUD();
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 600);

    // Draw background
    for (let y = 0; y < ROWS; y++) {
      if (y >= 2 && y <= 6) {
        ctx.fillStyle = '#000080'; // Water
      } else if (y >= 9 && y <= 13) {
        ctx.fillStyle = '#333'; // Road
      } else if (y === 1) {
        ctx.fillStyle = '#00FF00'; // Goal
      } else {
        ctx.fillStyle = '#008000'; // Grass
      }
      ctx.fillRect(0, y * TILE, 600, TILE);
    }

    // Draw logs
    logs.forEach(log => {
      ctx.fillStyle = log.color;
      ctx.fillRect(log.x * TILE, log.y * TILE, log.length * TILE, TILE - 2);
    });

    // Draw cars
    cars.forEach(car => {
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x * TILE, car.y * TILE, car.width * TILE, TILE - 2);
    });

    // Draw frog
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(frog.x * TILE + 5, frog.y * TILE + 5, TILE - 10, TILE - 10);
    // Frog eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(frog.x * TILE + 8, frog.y * TILE + 8, 4, 4);
    ctx.fillRect(frog.x * TILE + 18, frog.y * TILE + 8, 4, 4);
  }

  function gameOver() {
    gameRunning = false;
    const goEl = document.getElementById('game-over');
    goEl.innerHTML = `GAME OVER! Score: ${score} | <button onclick="FroggerGame.saveHigh()">💾 Salvar Record</button>`;
    goEl.style.display = 'block';
  }

  // Handle input
  function handleInput() {
    if (keys['ArrowUp'] && frog.y > 0) { frog.y--; keys['ArrowUp'] = false; }
    if (keys['ArrowDown'] && frog.y < ROWS - 1) { frog.y++; keys['ArrowDown'] = false; }
    if (keys['ArrowLeft'] && frog.x > 0) { frog.x--; keys['ArrowLeft'] = false; }
    if (keys['ArrowRight'] && frog.x < COLS - 1) { frog.x++; keys['ArrowRight'] = false; }
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

  window.FroggerGame = {
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
            body: JSON.stringify({username: window.currentUser, score: score, game: 'frogger'})
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
            const funny = ["🐸 Seu sapo afundou! Tenta de novo! 🐸", "😅 Carros te atropelaram! 💪", "💥 Caiu na água gelada! 🔄"];
            alert(funny[Math.floor(Math.random()*funny.length)]);
            return;
          }
          addScore(cleanName, score);
          alert('Recorde salvo! 🏆');
        }
      }
    }
  };

  FroggerGame = window.FroggerGame;
})();