var Snake = (function () {
  const INITIAL_TAIL = 4;
  var fixedTail = true;
  var intervalID;

  var tileCount = 15;
  var gridSize = 600 / tileCount;

  const INITIAL_PLAYER = { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) };

  var velocity = { x: 0, y: 0 };
  var player = { x: INITIAL_PLAYER.x, y: INITIAL_PLAYER.y };
  var fruit = { x: 1, y: 1 };
  var trail = [];
  var tail = INITIAL_TAIL;
  var points = 0;
  var pointsMax = 0;

  var ActionEnum = { 'none': 0, 'up': 1, 'down': 2, 'left': 3, 'right': 4 };
  Object.freeze(ActionEnum);
  var lastAction = ActionEnum.none;

  var canv, ctx;

  function setup() {
    canv = document.getElementById('gc');
    ctx = canv.getContext('2d');
    game.reset();
  }

  var game = {
    reset: function () {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canv.width, canv.height);

      tail = INITIAL_TAIL;
      points = 0;
      velocity = { x: 0, y: 0 };
      player = { x: INITIAL_PLAYER.x, y: INITIAL_PLAYER.y };
      trail = [{ x: player.x, y: player.y }];
      lastAction = ActionEnum.none;
      game.RandomFruit();

      document.getElementById('points').textContent = 'POINTS: 0';
      document.getElementById('top').textContent = 'TOP: 0';
    },

    action: {
      up:    () => { if (lastAction !== ActionEnum.down)  velocity = { x: 0, y: -1 }; },
      down:  () => { if (lastAction !== ActionEnum.up)    velocity = { x: 0, y: 1 }; },
      left:  () => { if (lastAction !== ActionEnum.right) velocity = { x: -1, y: 0 }; },
      right: () => { if (lastAction !== ActionEnum.left)  velocity = { x: 1, y: 0 }; }
    },

    RandomFruit: function () {
      fruit.x = Math.floor(Math.random() * tileCount);
      fruit.y = Math.floor(Math.random() * tileCount);
    },

    loop: function () {
      const stopped = velocity.x === 0 && velocity.y === 0;

      player.x += velocity.x;
      player.y += velocity.y;

      // atravessa as bordas
      if (player.x < 0) player.x = tileCount - 1;
      if (player.x >= tileCount) player.x = 0;
      if (player.y < 0) player.y = tileCount - 1;
      if (player.y >= tileCount) player.y = 0;

      if (!stopped) {
        trail.push({ x: player.x, y: player.y });
        while (trail.length > tail) trail.shift();
      }

      // fundo
      ctx.fillStyle = 'rgba(10,10,15,0.95)';
      ctx.fillRect(0, 0, canv.width, canv.height);

      // corpo da cobra
      ctx.fillStyle = 'green';
      for (let i = 0; i < trail.length - 1; i++) {
        ctx.fillRect(trail[i].x * gridSize + 1, trail[i].y * gridSize + 1, gridSize - 2, gridSize - 2);
        if (trail[i].x === player.x && trail[i].y === player.y) game.reset();
      }
      ctx.fillStyle = 'lime';
      ctx.fillRect(trail[trail.length - 1].x * gridSize + 1, trail[trail.length - 1].y * gridSize + 1, gridSize - 2, gridSize - 2);

      // comer fruta
      if (player.x === fruit.x && player.y === fruit.y) {
        if (!fixedTail) tail++;
        points++;
        if (points > pointsMax) pointsMax = points;
        document.getElementById('points').textContent = 'POINTS: ' + points;
        document.getElementById('top').textContent = 'TOP: ' + pointsMax;
        game.RandomFruit();
        while (trail.some(t => t.x === fruit.x && t.y === fruit.y)) game.RandomFruit();
      }

      // fruta
      ctx.fillStyle = 'red';
      ctx.fillRect(fruit.x * gridSize + 1, fruit.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
  };

  // teclado
  document.addEventListener('keydown', function (e) {
    switch (e.keyCode) {
      case 37: game.action.left();  break;
      case 38: game.action.up();    break;
      case 39: game.action.right(); break;
      case 40: game.action.down();  break;
      case 32: velocity = { x: 0, y: 0 }; break; // space
      case 27: game.reset();        break; // esc
    }
    e.preventDefault();
  });

  return {
    start: function (fps = 15) {
      window.onload = setup;
      intervalID = setInterval(game.loop, 1000 / fps);
    }
  };
})();

Snake.start(5);