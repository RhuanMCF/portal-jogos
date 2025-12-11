from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session, flash, jsonify
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

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
        if supabase:
            # Buscar do Supabase
            response = supabase.table('recordes').select('nome, pontuacao').order('pontuacao', desc=True).limit(5).execute()
            recordes = response.data
        else:
            # Fallback para dados locais (se Supabase não configurado)
            recordes = [
                {'nome': '---', 'pontuacao': 0},
                {'nome': '---', 'pontuacao': 0},
                {'nome': '---', 'pontuacao': 0},
                {'nome': '---', 'pontuacao': 0},
                {'nome': '---', 'pontuacao': 0}
            ]

        return jsonify(recordes)
    except Exception as e:
        print(f"Erro ao buscar recordes: {e}")
        return jsonify([]), 500

@app.route('/api/recordes', methods=['POST'])
def save_recorde():
    """Salva um novo recorde"""
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        pontuacao = data.get('pontuacao', 0)

        # Validações básicas
        if not nome or len(nome) > 20:
            return jsonify({'error': 'Nome inválido'}), 400

        if not isinstance(pontuacao, int) or pontuacao < 0 or pontuacao > 10000:
            return jsonify({'error': 'Pontuação inválida'}), 400

        if supabase:
            # Salvar no Supabase
            response = supabase.table('recordes').insert({
                'nome': nome,
                'pontuacao': pontuacao
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
    usuario = session.get('usuario')
    return render_template('index.html', usuario=usuario)

# Rota para o Snake
@app.route('/snake/')
def snake():
    usuario = session.get('usuario')
    return render_template('snake/index.html', usuario=usuario)

# Sistema de Login do Novo Projeto
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']

        # Verificar usuários fixos primeiro
        if usuario == 'RhuanMCF' and senha == 'admin123':
            session['usuario'] = 'RhuanMCF'
            return redirect('/')
        elif usuario == 'bruno' and senha == 'bruno123':
            session['usuario'] = 'bruno'
            return redirect('/')
        elif usuario == 'ícaro' and senha == 'ícaro123':
            session['usuario'] = 'icaro'
            return redirect('/')
        else:
            # Verificar usuários registrados
            users = load_users()
            if usuario in users and users[usuario] == senha:
                session['usuario'] = usuario
                return redirect('/')
            else:
                flash('Usuário ou senha incorretos!')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']
        confirmar_senha = request.form['confirmar_senha']

        if not usuario or not senha:
            flash('Preencha todos os campos!')
            return redirect('/register')

        if senha != confirmar_senha:
            flash('As senhas não coincidem!')
            return redirect('/register')

        users = load_users()
        if usuario in users:
            flash('Usuário já existe!')
            return redirect('/register')

        # Registrar novo usuário
        users[usuario] = senha
        save_users(users)
        flash('Usuário registrado com sucesso! Faça login.')
        return redirect('/')

    return render_template('register.html')

@app.route('/admin')
def admin():
    if session.get('usuario') != 'RhuanMCF':
        return redirect('/login')
    return render_template('admin.html')

@app.route('/bruno')
def bruno():
    if session.get('usuario') != 'bruno':
        return redirect('/login')
    return render_template('bruno.html')

@app.route('/icaro')
def icaro():
    if session.get('usuario') != 'ícaro':
        return redirect('/login')
    return render_template('icaro.html')

@app.route('/user')
def user():
    usuario = session.get('usuario')
    if not usuario:
        return redirect('/login')

    # Verificar se é um usuário registrado (não os fixos)
    users = load_users()
    if usuario not in users:
        return redirect('/login')

    return render_template('user.html', usuario=usuario)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# Rota para servir imagens do novo projeto
@app.route('/imagens/<path:filename>')
def imagens(filename):
    return send_from_directory('static/imagens', filename)

# Você pode adicionar mais jogos assim:
# @app.route('/pong/') ... etc

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)