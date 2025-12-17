var BreakoutGame;

(function () {
  const COLS = 15, ROWS = 10, TILE = 40;
  var canv, ctx;
  var paddle = { x: 250, y: 550, width: 100, height: 20 };
  var ball = { x: 300, y: 500, vx: 3, vy: -3, radius: 8 };
  var bricks = [];
  var score = 0, lives = 3, level = 1;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  function initBricks() {
    bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: c * TILE,
          y: r * TILE + 50,
          width: TILE - 2,
          height: 20,
          visible: true,
          color: ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'][r % 6]
        });
      }
    }
  }

  // Carrega os melhores recordes do servidor
  async function loadBestScores() {
    try {
      const response = await fetch('/api/recordes?game=breakout');
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

  // Salva o recorde no servidor via API
  async function saveBestScore(name, score) {
    try {
      const response = await fetch('/api/recordes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, score: score, game: 'breakout' })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  function reset() {
    paddle.x = 250;
    ball.x = 300; ball.y = 500; ball.vx = 3; ball.vy = -3;
    initBricks();
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

  function update() {
    if (!gameRunning) return;

    // Move paddle
    if (keys['ArrowLeft'] && paddle.x > 0) paddle.x -= 8;
    if (keys['ArrowRight'] && paddle.x < 600 - paddle.width) paddle.x += 8;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball collision with walls
    if (ball.x <= ball.radius || ball.x >= 600 - ball.radius) ball.vx = -ball.vx;
    if (ball.y <= ball.radius) ball.vy = -ball.vy;

    // Ball collision with paddle
    if (ball.y + ball.radius >= paddle.y &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.width &&
        ball.vy > 0) {
      ball.vy = -ball.vy;
      // Add some angle based on where it hits the paddle
      const hitPos = (ball.x - paddle.x) / paddle.width;
      ball.vx = (hitPos - 0.5) * 10;
    }

    // Ball collision with bricks
    bricks.forEach(brick => {
      if (brick.visible &&
          ball.x + ball.radius >= brick.x &&
          ball.x - ball.radius <= brick.x + brick.width &&
          ball.y + ball.radius >= brick.y &&
          ball.y - ball.radius <= brick.y + brick.height) {
        brick.visible = false;
        ball.vy = -ball.vy;
        score += 10;
        // Check if all bricks are gone
        if (bricks.every(b => !b.visible)) {
          level++;
          initBricks();
          ball.vy = -Math.abs(ball.vy) * 1.1; // Increase speed
        }
      }
    });

    // Ball falls off screen
    if (ball.y > 600) {
      lives--;
      if (lives <= 0) {
        gameOver();
      } else {
        ball.x = 300; ball.y = 500; ball.vx = 3; ball.vy = -3;
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 600);

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw ball
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function gameOver() {
    gameRunning = false;
    document.getElementById('game-over').textContent = 'GAME OVER';
    document.getElementById('game-over').style.display = 'block';
    // Save score if user is logged in
    if (window.currentUser && score > 0) {
      saveBestScore(window.currentUser, score);
    }
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

  window.BreakoutGame = {
    init: function() {
      canv = document.getElementById('gc');
      ctx = canv.getContext('2d');
      loadBestScores();
      reset();
      loop();
    }
  };

  BreakoutGame = window.BreakoutGame;
})();