from project import app
from flask import request, render_template, session, jsonify
import json
from project.models.mongo_logger import MongoLogger
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
from project.models.management import Management


app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/get-application-progress', methods=['GET'])
def get_application_progress():
    '''
    Esta rota é responsável pelo load de logs gerados pela aplicação
    '''

    if session.get('logged_in'):
        if request.method == 'GET':

            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = str(request.values)
            data = data.replace("CombinedMultiDict([ImmutableMultiDict([('", "")
            data = data.replace("', '')]), ImmutableMultiDict([])])", "")
            #data = data.replace("', '')])])", "")
            appInfo = json.loads(data)
            mongoLogger = MongoLogger(appInfo["application_name"], appInfo["schema_name"], str(session.get("user")), str(session.get("pwd")))
            progressLog = mongoLogger.load_progress(app.config["RUN_MODE"])
            #session["progress_lines"] = session["progress_lines"] + len(progressLog)


        return jsonify(progressLog)
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/get-application-status-name', methods=['GET'])
def get_application_status():
    '''
    Esta rota é responsável pelo load de logs gerados pela aplicação
    '''

    if session.get('logged_in'):
        if request.method == 'GET':

            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = str(request.values)
            data = data.replace(
                "CombinedMultiDict([ImmutableMultiDict([('", "")
            data = data.replace("', '')]), ImmutableMultiDict([])])", "")
            appInfo = json.loads(data)
            management = Management()

            status = management.getStatusByName(str(session.get("user")),
                                                appInfo["application_name"],
                                                appInfo["schema_name"])

        return status
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
