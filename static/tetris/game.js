var TetrisGame;

(function () {
  const COLS = 10, ROWS = 20, TILE = 30;
  var canv, ctx, nextCanv, nextCtx;
  var board = [];
  var currentPiece, nextPiece;
  var score = 0, lines = 0, level = 1;
  var dropTime = 0, dropSpeed = 1000;
  var gameRunning = true;
  var keys = {};
  var bestScores = [];

  // Tetromino shapes
  const PIECES = [
    [[[1,1,1,1]], [[1],[1],[1],[1]]], // I
    [[[1,1],[1,1]]], // O
    [[[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]], [[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]]], // T
    [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]], // S
    [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]], // Z
    [[[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]], [[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]]], // J
    [[[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]], [[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]]]  // L
  ];

  const COLORS = ['#00FFFF', '#FFFF00', '#800080', '#00FF00', '#FF0000', '#0000FF', '#FFA500'];

  function initBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  }

  function createPiece(type) {
    return {
      type: type,
      shape: PIECES[type][0],
      x: Math.floor(COLS/2) - 1,
      y: 0,
      rotation: 0
    };
  }

  async function loadBestScores() {
    if (window.currentUser) {
      try {
        const response = await fetch('/api/recordes?game=tetris');
        const data = await response.json();
        bestScores = data.scores.map(s => ({name: s.username, score: s.score}));
      } catch (e) {
        console.error('Erro ao carregar recordes:', e);
        bestScores = Array(5).fill({name:'---',score:0});
      }
    } else {
      try {
        const saved = localStorage.getItem('tetrisBestScores');
        bestScores = saved ? JSON.parse(saved) : Array(5).fill({name:'---',score:0});
      } catch { bestScores = Array(5).fill({name:'---',score:0}); }
    }
    updateScoresDisplay();
  }

  function saveBestScores() {
    if (!window.currentUser) {
      try { localStorage.setItem('tetrisBestScores', JSON.stringify(bestScores)); } catch(e) {}
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
    initBoard();
    currentPiece = createPiece(Math.floor(Math.random() * 7));
    nextPiece = createPiece(Math.floor(Math.random() * 7));
    score = 0; lines = 0; level = 1; dropSpeed = 1000; dropTime = 0;
    gameRunning = true;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
  }

  function updateHUD() {
    document.getElementById('score').textContent = `SCORE: ${score}`;
    document.getElementById('lines').textContent = `LINHAS: ${lines}`;
    document.getElementById('level').textContent = `LVL: ${level}`;
  }

  function validMove(piece, dx = 0, dy = 0, newRotation = piece.rotation) {
    const shape = PIECES[piece.type][newRotation % PIECES[piece.type].length];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function rotatePiece() {
    const newRotation = (currentPiece.rotation + 1) % PIECES[currentPiece.type].length;
    if (validMove(currentPiece, 0, 0, newRotation)) {
      currentPiece.rotation = newRotation;
      currentPiece.shape = PIECES[currentPiece.type][currentPiece.rotation];
    }
  }

  function movePiece(dx, dy) {
    if (validMove(currentPiece, dx, dy)) {
      currentPiece.x += dx;
      currentPiece.y += dy;
      return true;
    }
    return false;
  }

  function placePiece() {
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          board[currentPiece.y + y][currentPiece.x + x] = currentPiece.type + 1;
        }
      }
    }
  }

  function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== 0)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++; // Check the same line again
      }
    }
    if (linesCleared > 0) {
      lines += linesCleared;
      score += linesCleared * 100 * level;
      level = Math.floor(lines / 10) + 1;
      dropSpeed = Math.max(50, 1000 - (level - 1) * 100);
    }
  }

  function dropPiece() {
    if (!movePiece(0, 1)) {
      placePiece();
      clearLines();
      currentPiece = nextPiece;
      nextPiece = createPiece(Math.floor(Math.random() * 7));
      if (!validMove(currentPiece)) {
        gameOver();
      }
    }
  }

  function gameOver() {
    gameRunning = false;
    const goEl = document.getElementById('game-over');
    goEl.innerHTML = `GAME OVER! Score: ${score} | <button onclick="TetrisGame.saveHigh()">💾 Salvar Record</button>`;
    goEl.style.display = 'block';
  }

  function update() {
    if (!gameRunning) return;

    const now = performance.now();
    if (!update.lastTime) update.lastTime = now;
    const deltaTime = now - update.lastTime;

    dropTime += deltaTime;
    if (dropTime >= dropSpeed) {
      dropPiece();
      dropTime = 0;
    }
    update.lastTime = now;

    // Handle input
    if (keys['ArrowLeft'] && !keys['leftPressed']) {
      movePiece(-1, 0);
      keys['leftPressed'] = true;
    }
    if (keys['ArrowRight'] && !keys['rightPressed']) {
      movePiece(1, 0);
      keys['rightPressed'] = true;
    }
    if (keys['ArrowDown'] && !keys['downPressed']) {
      dropPiece();
      keys['downPressed'] = true;
    }
    if (keys['ArrowUp'] && !keys['upPressed']) {
      rotatePiece();
      keys['upPressed'] = true;
    }
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 600);

    // Draw board
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) {
          ctx.fillStyle = COLORS[board[y][x] - 1];
          ctx.fillRect(x * TILE + 150, y * TILE + 30, TILE - 1, TILE - 1);
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      const shape = currentPiece.shape;
      ctx.fillStyle = COLORS[currentPiece.type];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            ctx.fillRect((currentPiece.x + x) * TILE + 150, (currentPiece.y + y) * TILE + 30, TILE - 1, TILE - 1);
          }
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE + 150, 30);
      ctx.lineTo(x * TILE + 150, ROWS * TILE + 30);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(150, y * TILE + 30);
      ctx.lineTo(COLS * TILE + 150, y * TILE + 30);
      ctx.stroke();
    }

    // Draw next piece
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, 80, 80);
    if (nextPiece) {
      const shape = nextPiece.shape;
      nextCtx.fillStyle = COLORS[nextPiece.type];
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            nextCtx.fillRect(x * 20 + 20, y * 20 + 20, 18, 18);
          }
        }
      }
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
    keys['leftPressed'] = false;
    keys['rightPressed'] = false;
    keys['downPressed'] = false;
    keys['upPressed'] = false;
  });

  window.TetrisGame = {
    init: function() {
      canv = document.getElementById('gc');
      ctx = canv.getContext('2d');
      nextCanv = document.getElementById('next');
      nextCtx = nextCanv.getContext('2d');
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
            body: JSON.stringify({username: window.currentUser, score: score, game: 'tetris'})
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
            const funny = ["🚫 Seu Tetris tá torto! Tenta de novo! 🧱", "😅 Peças caem do lado errado! 💪", "💥 Linhas explodiram! 🔄"];
            alert(funny[Math.floor(Math.random()*funny.length)]);
            return;
          }
          addScore(cleanName, score);
          alert('Recorde salvo! 🏆');
        }
      }
    }
  };

  TetrisGame = window.TetrisGame;
})();