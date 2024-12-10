from project import app
from flask import request, render_template, session, jsonify
import json
from project.models.mongo_files import MongoFiles
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()


@app.route('/get-custom-code', methods=['GET', 'POST'])
def get_custom_code():
    '''
    Esta rota é responsável pelo load de arquivos de código de custom components
    '''
    if session.get('logged_in'):

        if request.method == 'GET':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))


            '''
            Atualiza o session com a aplicação corrente
            '''
            filesContent = mongoFiles.load_custom_code()

            return jsonify(filesContent)
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
