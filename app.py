from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

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