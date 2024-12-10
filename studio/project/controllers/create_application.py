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

def verifyStringSize(string):
    if len(string) > 25:
        if string[25] == "*" and string.rsplit("*", 1)[1].isnumeric():
            return True
        else:
            return False
    else:
        return True


@app.route('/rename-application', methods=['GET', 'POST'])
def rename_application():
    '''
    Esta rota é responsável por criar uma nova aplicação
    '''

    if session.get('logged_in'):

        if request.method == 'POST':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = request.data
            names = json.loads(data.decode("utf8"))

            if verifyStringSize(names["newName"]):
                mongoFiles.rename_application(names["oldName"], names["newName"])
            else:
                return jsonify("Application name cannot be greater than 25 characters"),405

            return "application created"

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/create-application', methods=['GET', 'POST'])
def create_application():
    '''
    Esta rota é responsável por criar uma nova aplicação
    '''

    if session.get('logged_in'):

        if request.method == 'POST':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = request.data
            appInfo = json.loads(data.decode("utf8"))

            if not verifyStringSize(appInfo["application_name"]):
                return jsonify("Application name cannot be greater than 25 characters"),405

            '''
            Salva o json de info da aplicação
            '''
            mongoFiles.save_application_info(appInfo)
            '''
            Atualiza o session com a aplicação corrente
            '''
            #session["data"]["current_application"] = appInfo["application_name"]

            return "application created"

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
