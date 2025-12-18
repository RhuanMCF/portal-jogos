from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'segredo123')

# Configuração Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️  Supabase não configurado. Usando modo offline.")

# Arquivo para armazenar usuários registrados (fallback)
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# ==================== API DE RECORDES ====================

@app.route('/api/recordes', methods=['GET'])
def get_recordes():
    """Retorna os top 5 recordes globais"""
    try:
        game = request.args.get('game', 'snake')  # Default para snake se não especificado
        
        # Mapear game para tabela específica
        table_map = {
            'snake': 'snake_scores',
            'bomberman': 'bomberman_scores',
            'breakout': 'breakout_scores',
            'pinball': 'pinball_scores',
            'frogger': 'frogger_scores',
            'invaders': 'invaders_scores',
            'racing': 'racing_scores',
            'tank': 'tank_scores',
            'tetris': 'tetris_scores'
        }
        table_name = table_map.get(game, 'snake_scores')  # Fallback para snake
        
        usuario = session.get('usuario')

        if supabase:
            # Buscar os top 5 recordes para o jogo específico
            response = supabase.table(table_name).select('username, score').order('score', desc=True).limit(5).execute()
            recordes = [{'username': r['username'], 'score': r['score']} for r in response.data]
            
            # Buscar o score do usuário logado
            user_score = 0
            if usuario:
                user_response = supabase.table(table_name).select('score').eq('username', usuario).order('score', desc=True).limit(1).execute()
                if user_response.data:
                    user_score = user_response.data[0]['score']
        else:
            # Fallback para dados locais (se Supabase não configurado)
            recordes = [
                {'username': '---', 'score': 0},
                {'username': '---', 'score': 0},
                {'username': '---', 'score': 0},
                {'username': '---', 'score': 0},
                {'username': '---', 'score': 0}
            ]
            user_score = 0

        return jsonify({'scores': recordes, 'userScore': user_score})
    except Exception as e:
        print(f"Erro ao buscar recordes: {e}")
        return jsonify({'scores': [], 'userScore': 0}), 500

@app.route('/api/recordes', methods=['POST'])
def save_recorde():
    """Salva um novo recorde"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        score = data.get('score', 0)
        game = data.get('game', 'snake')  # Default para snake

        # Mapear game para tabela específica
        table_map = {
            'snake': 'snake_scores',
            'bomberman': 'bomberman_scores',
            'breakout': 'breakout_scores',
            'pinball': 'pinball_scores',
            'frogger': 'frogger_scores',
            'invaders': 'invaders_scores',
            'racing': 'racing_scores',
            'tank': 'tank_scores',
            'tetris': 'tetris_scores'
        }
        table_name = table_map.get(game, 'snake_scores')

        # Validações básicas
        if not username or len(username) > 20:
            return jsonify({'error': 'Nome inválido'}), 400

        if not isinstance(score, int) or score < 0 or score > 10000:
            return jsonify({'error': 'Pontuação inválida'}), 400

        if supabase:
            # Deletar scores antigos do usuário para este jogo e inserir o novo
            supabase.table(table_name).delete().eq('username', username).execute()
            response = supabase.table(table_name).insert({
                'username': username,
                'score': score
            }).execute()

            return jsonify({'success': True, 'message': 'Recorde salvo!'})
        else:
            return jsonify({'error': 'Banco não configurado'}), 500

    except Exception as e:
        print(f"Erro ao salvar recorde: {e}")
        return jsonify({'error': 'Erro interno'}), 500

# ==================== ROTAS PRINCIPAIS ====================

# Página inicial do portal
@app.route('/')
def portal():
    return render_template('index.html')

# Rota para o Snake (e qualquer outro jogo que você colocar em subpastas)
@app.route('/snake/')
@app.route('/snake/<path:filename>')
def snake(filename='index.html'):
    return send_from_directory('templates/snake', filename)

# Você pode adicionar mais jogos assim:
# @app.route('/pong/') ... etc

if __name__ == '__main__':
    app.run(debug=True)