var PinballGame;

(function () {
  const WIDTH = 600, HEIGHT = 600;
  var canv, ctx;
  var ball = { x: 300, y: 500, vx: 0, vy: 0, radius: 8 };
  var flipperL = { x: 150, y: 550, angle: 0 };
  var flipperR = { x: 450, y: 550, angle: 0 };
  var bumpers = [];
  var score = 0, balls = 3, multiplier = 1;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  // Carrega os melhores recordes do servidor
  async function loadBestScores() {
    try {
      const response = await fetch('/api/recordes?game=pinball');
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
        body: JSON.stringify({ username: name, score: score, game: 'pinball' })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  function reset() {
    ball.x = 300; ball.y = 500; ball.vx = 0; ball.vy = 0;
    flipperL.angle = 0; flipperR.angle = 0;
    initBumpers();
    score = 0; balls = 3; multiplier = 1;
    gameRunning = true;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('balls').textContent = `BOLAS: ${balls}`;
    document.getElementById('multiplier').textContent = `MULT: ${multiplier}x`;
  }

  function initBumpers() {
    bumpers = [];
    // Circular bumpers
    bumpers.push({ x: 200, y: 200, radius: 30, type: 'circle', color: '#FF0000' });
    bumpers.push({ x: 400, y: 250, radius: 30, type: 'circle', color: '#FFFF00' });
    bumpers.push({ x: 300, y: 350, radius: 25, type: 'circle', color: '#00FF00' });

    // Rectangular bumpers
    bumpers.push({ x: 100, y: 300, width: 40, height: 20, type: 'rect', color: '#FF00FF' });
    bumpers.push({ x: 500, y: 400, width: 40, height: 20, type: 'rect', color: '#00FFFF' });
  }

  function update() {
    if (!gameRunning) return;

    // Launch ball if not moving
    if (ball.vx === 0 && ball.vy === 0 && keys[' ']) {
      ball.vx = (Math.random() - 0.5) * 4;
      ball.vy = -Math.random() * 8 - 2;
      keys[' '] = false;
    }

    // Apply gravity
    ball.vy += 0.3;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball collision with walls
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) {
      ball.vx = -ball.vx;
      ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
    }
    if (ball.y - ball.radius <= 0) {
      ball.vy = -ball.vy;
      ball.y = ball.radius;
    }

    // Ball collision with flippers
    const flipperSpeed = 0.2;

    // Left flipper
    if (keys['z'] || keys['Z']) {
      flipperL.angle = Math.min(0.5, flipperL.angle + flipperSpeed);
    } else {
      flipperL.angle = Math.max(0, flipperL.angle - flipperSpeed);
    }

    // Right flipper
    if (keys['/'] || keys['?']) {
      flipperR.angle = Math.max(-0.5, flipperR.angle - flipperSpeed);
    } else {
      flipperR.angle = Math.min(0, flipperR.angle + flipperSpeed);
    }

    // Check flipper collisions (simplified)
    if (ball.y > 520 && ball.y < 580) {
      if (ball.x < 300 && ball.vy > 0 && flipperL.angle > 0) {
        ball.vy = -Math.abs(ball.vy) * 1.2;
        ball.vx -= 2;
      }
      if (ball.x > 300 && ball.vy > 0 && flipperR.angle < 0) {
        ball.vy = -Math.abs(ball.vy) * 1.2;
        ball.vx += 2;
      }
    }

    // Ball collision with bumpers
    bumpers.forEach(bumper => {
      let hit = false;
      if (bumper.type === 'circle') {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < ball.radius + bumper.radius) {
          hit = true;
          // Bounce
          const angle = Math.atan2(dy, dx);
          ball.vx = Math.cos(angle) * Math.abs(ball.vx) * 1.1;
          ball.vy = Math.sin(angle) * Math.abs(ball.vy) * 1.1;
        }
      } else if (bumper.type === 'rect') {
        if (ball.x + ball.radius > bumper.x && ball.x - ball.radius < bumper.x + bumper.width &&
            ball.y + ball.radius > bumper.y && ball.y - ball.radius < bumper.y + bumper.height) {
          hit = true;
          ball.vy = -Math.abs(ball.vy) * 1.1;
        }
      }

      if (hit) {
        score += 10 * multiplier;
        multiplier = Math.min(5, multiplier + 1);
      }
    });

    // Ball falls off screen
    if (ball.y > HEIGHT + 50) {
      balls--;
      multiplier = 1;
      if (balls <= 0) {
        gameOver();
      } else {
        ball.x = 300; ball.y = 500; ball.vx = 0; ball.vy = 0;
      }
    }

    updateHUD();
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw table outline
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, WIDTH - 20, HEIGHT - 20);

    // Draw bumpers
    bumpers.forEach(bumper => {
      ctx.fillStyle = bumper.color;
      if (bumper.type === 'circle') {
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(bumper.x, bumper.y, bumper.width, bumper.height);
      }
    });

    // Draw flippers
    ctx.fillStyle = '#00FFFF';
    // Left flipper
    ctx.save();
    ctx.translate(flipperL.x, flipperL.y);
    ctx.rotate(flipperL.angle);
    ctx.fillRect(-50, -5, 50, 10);
    ctx.restore();

    // Right flipper
    ctx.save();
    ctx.translate(flipperR.x, flipperR.y);
    ctx.rotate(flipperR.angle);
    ctx.fillRect(0, -5, 50, 10);
    ctx.restore();

    // Draw ball
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw launcher lane
    ctx.fillStyle = '#333';
    ctx.fillRect(295, 500, 10, 100);
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

  window.PinballGame = {
    init: function() {
      canv = document.getElementById('gc');
      ctx = canv.getContext('2d');
      loadBestScores();
      reset();
      loop();
    }
  };

  PinballGame = window.PinballGame;
})();