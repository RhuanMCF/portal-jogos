var Snake = (function () {
  const INITIAL_TAIL = 4;
  var fixedTail = false;
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
  var nextAction = ActionEnum.none; // Ação pendente para o próximo frame

  var bestScores = [];

  // Inicializar Supabase
  var supabase = null;
  if (window.supabaseConfig && window.supabaseConfig.url && window.supabaseConfig.anonKey) {
    supabase = window.supabase.createClient(window.supabaseConfig.url, window.supabaseConfig.anonKey);
  }

  // Limpa duplicatas mantendo apenas o melhor recorde de cada usuário
  function cleanDuplicateScores() {
    const userBestScores = {};

    // Para cada recorde, mantém apenas o melhor score de cada usuário
    bestScores.forEach(record => {
      // Exclui entradas vazias e nomes padrão que não são usuários reais
      if (record.name !== '---' && record.name !== 'Jogador' && record.name.trim() !== '') {
        if (!userBestScores[record.name] || record.score > userBestScores[record.name]) {
          userBestScores[record.name] = record.score;
        }
      }
    });

    // Converte de volta para o formato do array
    const cleanedScores = [];
    for (const [name, score] of Object.entries(userBestScores)) {
      cleanedScores.push({ name: name, score: score });
    }

    // Adiciona entradas vazias se necessário para manter 5 posições
    while (cleanedScores.length < 5) {
      cleanedScores.push({ name: '---', score: 0 });
    }

    // Ordena por pontuação decrescente e mantém top 5
    bestScores = cleanedScores.sort((a, b) => b.score - a.score).slice(0, 5);

    // Salva os dados limpos
    saveBestScores();
  }

  // Carrega os melhores recordes do Supabase (ou localStorage como fallback)
  async function loadBestScores() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('high_scores')
          .select('username, score')
          .order('score', { ascending: false })
          .limit(5);
        if (error) throw error;
        bestScores = data.map(record => ({
          name: record.username,
          score: record.score
        }));
        // Completa com placeholders se necessário
        while (bestScores.length < 5) {
          bestScores.push({ name: '---', score: 0 });
        }
      } catch (e) {
        console.log('Erro ao carregar do Supabase, usando localStorage:', e);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    updateBestScoresDisplay();
  }

  // Fallback para localStorage
  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('snakeBestScores');
      if (saved) {
        bestScores = JSON.parse(saved);
        cleanDuplicateScores();
      } else {
        bestScores = [
          { name: '---', score: 0 },
          { name: '---', score: 0 },
          { name: '---', score: 0 },
          { name: '---', score: 0 },
          { name: '---', score: 0 }
        ];
      }
    } catch (localError) {
      console.log('localStorage não disponível, usando valores padrão');
      bestScores = [
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 },
        { name: '---', score: 0 }
      ];
    }
  }

  // Salva os melhores recordes no localStorage
  function saveBestScores() {
    try {
      localStorage.setItem('snakeBestScores', JSON.stringify(bestScores));
    } catch (e) {
      console.log('Não foi possível salvar no localStorage');
    }
  }

  // Atualiza o display dos melhores recordes
  function updateBestScoresDisplay() {
    const scoreElements = document.querySelectorAll('.best-score');
    bestScores.forEach((score, index) => {
      scoreElements[index].textContent = `${index + 1}. ${score.nome || score.name} : ${score.pontuacao || score.score}`;
    });
  }

  // Adiciona um novo recorde (agora usa API)
  async function addBestScore(name, score) {
    // Salva no servidor
    const success = await saveBestScore(name, score);
    if (success) {
      alert('Recorde salvo com sucesso!');
      // Recarrega os scores após salvar
      await loadBestScores();
    } else {
      alert('Erro ao salvar recorde. Verifique o console para detalhes.');
    }
  }

  // Salva o recorde diretamente no Supabase
  async function saveBestScore(name, score) {
    if (!supabase) {
      console.log('Supabase não configurado, salvando apenas localmente');
      return false;
    }
    try {
      console.log('Tentando salvar score no Supabase:', { username: name, score: score });
      // Primeiro, deleta records antigos do usuário para manter apenas o melhor
      await supabase
        .from('high_scores')
        .delete()
        .eq('username', name);
      // Insere o novo score
      const { data, error } = await supabase
        .from('high_scores')
        .insert([{ username: name, score: score }]);
      if (error) throw error;
      console.log('Score salvo com sucesso:', data);
      return true;
    } catch (error) {
      console.error('Erro ao salvar recorde no Supabase:', error);
      return false;
    }
  }

  var canv, ctx;

  async function setup() {
    canv = document.getElementById('gc');
    ctx = canv.getContext('2d');
    await loadBestScores();

    // Configurar Realtime para atualizações automáticas
    if (supabase) {
      supabase
        .channel('high_scores_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'high_scores' }, (payload) => {
          console.log('Mudança detectada em high_scores:', payload);
          loadBestScores(); // Recarrega os scores automaticamente
        })
        .subscribe();
    }

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
      document.getElementById('top').textContent = 'TOP: ' + pointsMax;
    },

    action: {
      up:    () => { if (lastAction !== ActionEnum.down)  { velocity = { x: 0, y: -1 }; nextAction = ActionEnum.up; } },
      down:  () => { if (lastAction !== ActionEnum.up)    { velocity = { x: 0, y: 1 }; nextAction = ActionEnum.down; } },
      left:  () => { if (lastAction !== ActionEnum.right) { velocity = { x: -1, y: 0 }; nextAction = ActionEnum.left; } },
      right: () => { if (lastAction !== ActionEnum.left)  { velocity = { x: 1, y: 0 }; nextAction = ActionEnum.right; } }
    },

    RandomFruit: function () {
      fruit.x = Math.floor(Math.random() * tileCount);
      fruit.y = Math.floor(Math.random() * tileCount);
    },

    loop: function () {
      const stopped = velocity.x === 0 && velocity.y === 0;

      // Atualiza a última ação ANTES do movimento
      if (nextAction !== ActionEnum.none) {
        lastAction = nextAction;
        nextAction = ActionEnum.none;
      }

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
        if (trail[i]) {
          ctx.fillRect(trail[i].x * gridSize + 1, trail[i].y * gridSize + 1, gridSize - 2, gridSize - 2);
          if (trail[i].x === player.x && trail[i].y === player.y) game.reset();
        }
      }
      ctx.fillStyle = 'lime';
      if (trail.length > 0 && trail[trail.length - 1]) {
        ctx.fillRect(trail[trail.length - 1].x * gridSize + 1, trail[trail.length - 1].y * gridSize + 1, gridSize - 2, gridSize - 2);
      }

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
    // Só previne default para teclas que o jogo usa
    var gameKeys = [37, 38, 39, 40, 32, 27]; // ← ↑ → ↓ SPACE ESC

    if (gameKeys.includes(e.keyCode)) {
      switch (e.keyCode) {
        case 37: game.action.left();  break;
        case 38: game.action.up();    break;
        case 39: game.action.right(); break;
        case 40: game.action.down();  break;
        case 32: velocity = { x: 0, y: 0 }; break; // space
        case 27: game.reset();        break; // esc
      }
      e.preventDefault();
    }
    // Outras teclas/combinações (como Ctrl + - para zoom) funcionam normalmente
  });

  return {
    start: function (fps = 15) {
      window.onload = async function() {
        await setup();
        // Adiciona event listener para o botão salvar
        document.getElementById('save-score').addEventListener('click', function() {
          // Pega o valor do TOP (recorde pessoal da sessão)
          const topText = document.getElementById('top').textContent;
          const topScore = parseInt(topText.replace('TOP: ', '')) || 0;

          // Verifica se é um novo recorde
          const userRecords = bestScores.filter(record => record.name === window.currentUser);
          const userBestScore = userRecords.length > 0 ? Math.max(...userRecords.map(r => r.score)) : 0;

          if (topScore <= userBestScore && userBestScore > 0) {
            // Mensagens engraçadas para recordes ruins
            const funnyMessages = [
              "🚫 Eita! Isso foi pior que uma lesma com jetpack! Tenta de novo! 🐌",
              "😅 Seu recorde atual ri da sua cara! Vai, mostra pra ele quem manda! 💪",
              "🎯 Errou feio! Até meu avô joga melhor que isso! Tenta outra vez! 👴",
              "🤣 Que pontuação ridícula! Vai lavar a mão e volta! 🧼",
              "💩 Isso foi tão ruim que até o jogo ficou com vergonha! Tenta de novo! 😳",
              "🎪 Circense! Você conseguiu perder pro seu próprio recorde! 👏",
              "🤡 Palhaço! Seu recorde tá rindo tanto que tá doendo a barriga! 😂",
              "🗑️ Essa pontuação vai pro lixo! Tira uma folga e volta melhor! 🗑️"
            ];

            const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
            alert(randomMessage);
            return;
          }

          if (topScore > 0) {
            const name = window.currentUser || prompt('Digite seu nome para o recorde:');
            if (name && name.trim() !== '') {
              addBestScore(name.trim(), topScore);
            }
          } else {
            alert('Faça pontos primeiro!');
          }
        });
      };
      intervalID = setInterval(game.loop, 1000 / fps);
    }
  };
})();

Snake.start(10);