import os
from flask import Flask, render_template, session, redirect, url_for, request, make_response, jsonify
from flask_socketio import SocketIO, emit
app = Flask(__name__, static_url_path='/static')
socketio = SocketIO(app)
users = []
@app.route("/")
def signin():
    if 'username' in session:
        return redirect(url_for('index'))
    else:
        return render_template("signin.html")
@app.route('/add_user', methods=['POST'])
def add_user ():
    username = request.form.get('username')
    if username not in users:
        session['username'] = username
        users.append(username)
        return make_response(jsonify({'message':'user was successfully added', 'path':'/index'}), 200)
    else:
        return make_response(jsonify({'message':'this is username is already taken'}), 500)
@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/index")
def index():
    return render_template("index.html")

@socketio.on('connect')
def connect ():
    print('CONNECTED')
app.secret_key = r"b'\xc7\xba\xde>?\x1e\xfd\x10\xc7\xf6\xf0\x11?\xec\xd2S\x9b\xe9\xaby{\x19\xbe-'"
if __name__ == "__main__":
    socketio.run(app)
