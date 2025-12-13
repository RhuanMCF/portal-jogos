# 🐍 Portal de Jogos - Snake Game

Um portal de jogos com Snake Game e sistema de recordes globais usando Supabase.

## 🚀 Funcionalidades

- ✅ Jogo Snake completo
- ✅ Sistema de login/registro
- ✅ Recordes globais na nuvem
- ✅ Controle de acesso (só logados jogam)
- ✅ Placar de recordes compartilhado
- ✅ Validação de recordes
- ✅ Zoom do navegador liberado

## 🛠️ Configuração do Supabase

### 1. Criar Conta
- Acesse: https://supabase.com/
- Crie conta gratuita

### 2. Criar Projeto
- Clique "New Project"
- Escolha nome (ex: `portal-jogos`)
- Selecione região próxima
- Defina senha do banco

### 3. Configurar Tabela
No painel lateral esquerdo, vá em **"Table Editor"**:

```sql
-- Execute este SQL no "SQL Editor":
CREATE TABLE recordes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    pontuacao INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ou crie manualmente:
-- Nome da tabela: recordes
-- Colunas:
--   - id: int8 (primary key, auto-increment)
--   - nome: text
--   - pontuacao: int4
--   - created_at: timestamptz (default: now())
```

### 4. Copiar Credenciais
No painel lateral esquerdo, vá em **"Settings" → "API"**:

**URL do Projeto:**
```
https://abcdefghijklmnop.supabase.co
```

**Chave Anônima (anon public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Configurar .env
Edite o arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=qualquer-chave-segura-aqui-12345
```

## 🎮 Como Jogar

### Localmente:
```bash
# Instalar dependências
pip install -r requirements.txt

# Executar
python app.py
```

Acesse: http://localhost:5000

### Online (Render):
1. Configure Supabase conforme acima
2. Faça deploy no Render
3. Convide amigos!

## 🎯 Regras do Jogo

- **Controles**: Setas direcionais ou WASD
- **Objetivo**: Comer frutas sem bater nas paredes ou no próprio corpo
- **Pausa**: Barra de espaço
- **Reset**: ESC
- **Recordes**: Aparecem automaticamente no placar direito

## 🏆 Sistema de Recordes

- Recordes salvos na nuvem (Supabase)
- Compartilhado entre todos os jogadores
- Top 5 recordes exibidos
- Validação automática
- Mensagens divertidas para recordes ruins

## 🔧 Tecnologias

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Banco**: Supabase (PostgreSQL)
- **Deploy**: Render
- **Autenticação**: Sessões Flask

## 📁 Estrutura do Projeto

```
portal-jogos/
├── app.py                 # Servidor Flask
├── requirements.txt       # Dependências
├── runtime.txt           # Versão Python (Render)
├── Procfile              # Comando start (Heroku)
├── .env                  # Variáveis ambiente (não commitar)
├── .gitignore           # Arquivos ignorados
├── users.json           # Usuários (fallback)
├── static/
│   └── snake/
│       ├── game.js       # Lógica do jogo
│       └── style.css     # Estilos
└── templates/
    ├── index.html        # Página inicial
    ├── login.html        # Login
    ├── register.html     # Registro
    └── snake/
        └── index.html    # Jogo Snake
```

## 🚀 Deploy

### Render (Recomendado):
1. Conecte seu GitHub no Render
2. Selecione este repositório
3. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
4. Adicione variável: `FLASK_ENV=production`

### Heroku:
1. Instale Heroku CLI
2. `heroku create nome-do-app`
3. `git push heroku main`

## 🔐 Segurança

- Validação de dados no servidor
- Limitação de pontuação (0-10000)
- Limitação de nome (20 caracteres)
- Rate limiting automático no Supabase
- Credenciais protegidas em .env

## 🐛 Troubleshooting

### Erro: "supabase module not found"
```bash
pip install supabase python-dotenv
```

### Erro: "Table doesn't exist"
- Verifique se criou a tabela `recordes` no Supabase
- Execute o SQL no "SQL Editor"

### Recordes não aparecem
- Verifique se as credenciais no `.env` estão corretas
- Teste a API: `GET /api/recordes`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Render
2. Teste localmente primeiro
3. Verifique as credenciais do Supabase

---

**Divirta-se jogando! 🐍🎮**
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave secreta do Flask (crie uma segura)
SECRET_KEY=sua-chave-secreta-muito-segura-aqui
```

### 5. Instalar dependências

```bash
pip install -r requirements.txt
```

### 6. Executar o jogo

```bash
python app.py
```

Acesse: http://localhost:5000

## 🎮 Como jogar

- **Setas** ou **WASD**: Mover cobra
- **SPACE**: Pausar
- **ESC**: Resetar jogo
- **Objetivo**: Comer frutas sem bater nas paredes ou no próprio corpo

## 🚀 Deploy

### Render (Recomendado)
1. Conecte seu GitHub no Render
2. Crie Web Service
3. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
4. Adicione variáveis de ambiente no painel do Render

### Heroku
1. Instale Heroku CLI
2. Configure Procfile e runtime.txt
3. `heroku create` e `git push heroku main`

## 🔒 Segurança

- Validação de dados no servidor
- Rate limiting nas APIs
- Autenticação obrigatória para jogar
- Dados armazenados de forma segura no Supabase

## 📊 APIs

### GET /api/recordes
Retorna top 5 recordes globais

### POST /api/recordes
Salva novo recorde
```json
{
  "nome": "Jogador123",
  "pontuacao": 150
}
```

## 🎯 Próximos passos

- [ ] Sistema de conquistas
- [ ] Modos de jogo diferentes
- [ ] Chat entre jogadores
- [ ] Estatísticas detalhadas

---

**Divirta-se jogando! 🐍🎮**