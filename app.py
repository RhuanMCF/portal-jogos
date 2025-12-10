from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session, flash
import json
import os

app = Flask(__name__)
app.secret_key = 'segredo123'  # depois muda pra algo forte

# Arquivo para armazenar usuários registrados
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

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