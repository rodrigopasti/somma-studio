from project import app
from flask import request, render_template, jsonify, session
from project.models.mongo_files import MongoFiles
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
import json

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/get-models', methods=['GET'])
def get_models():

    if session.get('logged_in'):

        if request.method == 'GET':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            '''
            Fazer a leitura de todos os modelos do componente da aplicação
            '''
            data = request.values.to_dict()

            for key in data:
                data = json.loads(key)

            models = mongoFiles.load_models(data["application_name"], data["component_name"])

            return jsonify({model["_id"]: model["models"] for model in models})

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})

@app.route('/save-selected-models', methods=['POST'])
def save_selected_models():

    if session.get('logged_in'):

        if request.method == 'POST':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            '''
            Fazer a leitura de todos os modelos do componente da aplicação
            '''
            data = request.data
            data = json.loads(data.decode("utf8"))

            models = mongoFiles.save_selected_models(data["application_name"], data["component_name"], data["models_ids"])

            return jsonify(True)

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})

@app.route('/delete-selected-models', methods=['GET'])
def delete_selected_models():
    if session.get('logged_in'):
        if request.method == 'GET':
            
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))

            appName = str(request.args.get("application_name", ""))
            models_ids = request.args.getlist("models_ids[]")           
            models = mongoFiles.delete_selected_models(appName, models_ids)

            return jsonify(True)

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})