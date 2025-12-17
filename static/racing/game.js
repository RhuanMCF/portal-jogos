var RacingGame;

(function () {
  const COLS = 30, ROWS = 30, TILE = 20;
  var canv, ctx;
  var car = { x: 14, y: 25 };
  var roadOffset = 0;
  var obstacles = [];
  var score = 0, speed = 1, distance = 0;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  async function loadBestScores() {
    if (window.currentUser) {
      try {
        const response = await fetch('/api/recordes?game=racing');
        const data = await response.json();
        bestScores = data.scores.map(s => ({name: s.username, score: s.score}));
      } catch (e) {
        console.error('Erro ao carregar recordes:', e);
        bestScores = Array(5).fill({name:'---',score:0});
      }
    } else {
      try {
        const saved = localStorage.getItem('racingBestScores');
        bestScores = saved ? JSON.parse(saved) : Array(5).fill({name:'---',score:0});
      } catch { bestScores = Array(5).fill({name:'---',score:0}); }
    }
    updateScoresDisplay();
  }

  function saveBestScores() {
    if (!window.currentUser) {
      try { localStorage.setItem('racingBestScores', JSON.stringify(bestScores)); } catch(e) {}
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
    car.x = 14; car.y = 25;
    roadOffset = 0;
    obstacles = [];
    score = 0; speed = 1; distance = 0;
    gameRunning = true;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('speed').textContent = `VEL: ${speed}`;
    document.getElementById('distance').textContent = `DIST: ${distance}`;
  }

  function update() {
    if (!gameRunning) return;

    // Move road
    roadOffset += speed;
    distance += speed;

    // Generate obstacles
    if (Math.random() < 0.05) {
      const lane = Math.floor(Math.random() * 3); // 3 lanes
      obstacles.push({ x: 8 + lane * 6, y: -2, type: Math.floor(Math.random() * 3) });
    }

    // Move obstacles
    obstacles.forEach(obs => obs.y += speed);

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.y < 32);

    // Move car
    if (keys['ArrowLeft'] && car.x > 8) car.x -= 0.5;
    if (keys['ArrowRight'] && car.x < 20) car.x += 0.5;

    // Collision detection
    obstacles.forEach(obs => {
      if (Math.abs(obs.x - car.x) < 2 && Math.abs(obs.y - car.y) < 2) {
        gameOver();
      }
    });

    // Increase speed over time
    if (distance % 100 === 0) {
      speed = Math.min(5, speed + 0.1);
    }

    score = Math.floor(distance / 10);
    updateHUD();
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 600);

    // Draw road
    ctx.fillStyle = '#333';
    ctx.fillRect(160, 0, 280, 600);

    // Draw road lines
    ctx.fillStyle = '#FFFF00';
    for (let i = 0; i < 600; i += 40) {
      const y = (i - roadOffset) % 600;
      ctx.fillRect(290, y, 4, 20);
      ctx.fillRect(306, y, 4, 20);
    }

    // Draw lane dividers
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(220, 0, 2, 600);
    ctx.fillRect(378, 0, 2, 600);

    // Draw obstacles
    obstacles.forEach(obs => {
      const colors = ['#FF0000', '#FF8800', '#FFFF00'];
      ctx.fillStyle = colors[obs.type];
      ctx.fillRect(obs.x * TILE, obs.y * TILE, TILE - 2, TILE - 2);
    });

    // Draw car
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(car.x * TILE, car.y * TILE, TILE - 2, TILE - 2);
    // Car details
    ctx.fillStyle = '#008800';
    ctx.fillRect(car.x * TILE + 2, car.y * TILE + 2, TILE - 6, TILE - 6);
  }

  function gameOver() {
    gameRunning = false;
    const goEl = document.getElementById('game-over');
    goEl.innerHTML = `GAME OVER! Score: ${score} | <button onclick="RacingGame.saveHigh()">💾 Salvar Record</button>`;
    goEl.style.display = 'block';
  }

  function loop() {
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

  window.RacingGame = {
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
            body: JSON.stringify({username: window.currentUser, score: score, game: 'racing'})
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
            const funny = ["🚫 Seu carro quebrou! Tenta de novo! 🚗", "😅 Bateu na mureta! 💪", "💥 Acelerou demais! 🔄"];
            alert(funny[Math.floor(Math.random()*funny.length)]);
            return;
          }
          addScore(cleanName, score);
          alert('Recorde salvo! 🏆');
        }
      }
    }
  };

  RacingGame = window.RacingGame;
})();