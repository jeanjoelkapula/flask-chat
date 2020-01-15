import os, glob, json
from datetime import datetime
from flask import Flask, render_template, session, redirect, url_for, request, make_response, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_session import Session

app = Flask(__name__, static_url_path='/static')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['IMAGE_UPLOADS'] = os.path.join(app.root_path, r'static\profile_images')
Session(app)
socketio = SocketIO(app, manage_session=False)

#keep track of users
users = []

#keep track of channels and messages
channels = dict()
channels["General"] = {"messages":[{"author":"jayjay", "text":"Hello guys!","date":"21 Dec 2019 12:00:00", "time":"12:00"},{"author":"Mike", "text":"Sup jayjay!","date":"21 Dec 2019 12:01:00",  "time":"12:05"}]}

@app.route("/")
def signin():
    if 'username' not in session:
        return render_template("signin.html")
    else:
        return redirect(url_for('index'))
@app.route('/add_user', methods=['POST'])
def add_user ():
    username = request.form.get('username')
    if username not in users:
        session['username'] = username
        session['last-channel'] = "General"
        session['theme'] = 'Dark'
        room = "General"
        users.append(username)
        return make_response(jsonify({'success':True,'message':'user was successfully added', 'path':'/index', 'last_channel':'General', 'theme':'Dark'}), 200)
    else:
        return make_response(jsonify({'success':False, 'message':'This username is already taken'}),500)
@socketio.on('join')
def join (data):
    join_room(data['channel'])
    channel_name = data['channel'] 
    channels[channel_name]["messages"].append({'author': session['username'], 'text':'joined ' + data['channel'],'date':data['date'], 'time':data['time']})
    emit('join_success', {'channel':data['channel'],'message': 'you have successfuly joined' + data['channel'], 'date':data['date']}, room = request.sid)
    emit('user_joined', {'author': session['username'], 'text':'joined ' + data['channel'], 'channel':data['channel'], 'date':data['date'], 'time':data['time']}, broadcast=True)
@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/index")
def index():
    if 'username' in session:
        if glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + '.*')):
            hasProfile = True
            files = glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + '.*'))
            path, extension = os.path.splitext(files[0])
        else:
            hasProfile = False
            extension = ''
        channel_names = []  
        for index in range(len(list(channels))):
            channel_names.append(list(channels)[index])
        return render_template("index.html", channels = channel_names, username=session['username'], hasProfile = hasProfile, profile_type=extension, theme=session['theme'])
    else:
        return render_template('signin.html')
@app.route("/unread_counts", methods=["POST"])
def undread_counts ():
    data = json.loads(request.form.get('channels'))
    print(data)
    counts = dict ()
    i = 0
    for channel in channels:
        c = 0
        print(channels[channel]["messages"])
        print({data[i][channel]}, 'last read: is', {data[i][channel]})
        channel_last_read = datetime.strptime(data[i][channel], '%d %b %Y %H:%M:%S')
        for message in channels[channel]['messages']:
            message_date = datetime.strptime(message['date'], '%d %b %Y %H:%M:%S')
            if channel_last_read < message_date:
                c += 1
            print('message date ', message['date'])
        counts[channel] = c
        print(data[i][channel], ":", c)
        i += 1
    return make_response(counts, 200)
@app.route('/load_messages', methods=["POST"])
def load_messages ():
    messages = []
    data = dict()
    last_channel = request.form.get('last-channel')
    for message in channels[last_channel]["messages"]:
        if glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], message['author'] + '.*')):
            hasProfile = 'true'
            files = glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], message['author'] + '.*'))
            path, extension = os.path.splitext(files[0])
        else:
            hasProfile = 'false'
            extension = ''
        messages.append({"author":message["author"], "text":message["text"],"date":message["date"], "time":message["time"], 'hasProfile':hasProfile, 'extension':extension})
    data['messages'] = messages
    data['has_profile'] = hasProfile
    data['profile_type'] = extension
    return make_response(json.dumps(data), 200)

def get_message_template(messages):
    return render_template('messages.html', messages = messages)
@socketio.on('user_connection')
def connect (data):
    channels = data['joined-channels'].split(',')
    for channel in channels:
        join_room(channel)
@socketio.on('send_message')
def send_message(data):
    room = data["channel"]
    if len(channels[room]["messages"]) == 100:
        channels[room]["messages"].pop(0)
    channels[room]["messages"].append({'author': session['username'], 'text':data['message'],'date':data['date'],'time':data['time'], 'type':type})
    message = {'author': session['username'], 'text':data['message'],'date':data['date'], 'time':data['time'], 'type':type}
    response_data = dict()
    response_data["channel"] = room
    response_data["author"] = data["username"]
    response_data["text"] = data["message"]
    response_data["date"] = data["date"]
    response_data["time"] = data["time"]
    if glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], data['username'] + '.*')):
            hasProfile = 'true'
            files = glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], data['username'] + '.*'))
            path, extension = os.path.splitext(files[0])
    else:
        hasProfile = 'false'
        extension = ''
    response_data["hasProfile"] = hasProfile
    response_data["extension"] = extension
    emit('announce_message', json.dumps(response_data),room=room)
@socketio.on('create_channel')
def create_channel(data):
    channel_name = data['channel_name']
    if channel_name not in channels:
        channels[channel_name] = {'messages':[]}
        join_room(channel_name)
        emit('channel_create_confirm', {'channel': channel_name}, room = request.sid)
        emit('channel_created', {'success':True, 'channel':channel_name}, broadcast=True)
    else: 
        emit('channel_created', {'success':False, 'message':'This channel already exits'}, room = request.sid)
@app.route('/upload_image', methods=["POST"])
def file_upload():
    image = request.files["image"]
    name, extension = os.path.splitext(image.filename)
    try:
        if glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + '.*')):
            files = glob.glob(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + '.*'))
            path, ext = os.path.splitext(files[0])
            os.remove(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + ext))
            image.save(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + extension))
        else:
            image.save(os.path.join(app.config['IMAGE_UPLOADS'], session['username'] + extension))
        return make_response(jsonify({'message':'user profile has been updated', 'source':'../static/profile_images/' + (session['username'] + extension)}), 200)
    except Exception as e:
        return make_response(jsonify({'messages':'user profile update has failed'}), 500)

@socketio.on('profile_update_success')
def profile_update_success (data):
    emit('announce_profile_update', {'user': data['user'], 'result':data['result']}, broadcast=True)
@app.route('/theme', methods=["POST"])
def update_theme():
    theme = request.form.get('theme')
    session['theme'] = theme
    return make_response(jsonify({'message':'theme has been updated', 'url':url_for('index'), 'theme':theme}), 200)
if __name__ == "__main__":
    socketio.run(app, host = '192.168.8.101')