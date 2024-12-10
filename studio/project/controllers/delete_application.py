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


@app.route('/delete-application', methods=['GET', 'POST'])
def delete_application():
    '''
    Esta rota é responsável pelo load de aplicações
    '''

    if session.get('logged_in'):
        
        if request.method == 'GET':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            applicationJSONs = {}
            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            appName = str(request.args.get("application_name", ""))

            type_app = str(request.args.get("type", ""))
            workspace = str(request.args.get("workspace", ""))

            if type_app == "workspace":
                workspace = str(session.get("emp_user"))
                author = str(session.get("email"))
                if mongoFiles.verify_workspace_authorship(appName, workspace, author):
                    applicationJSONs = mongoFiles.delete_shared_application(appName, workspace)
                else: 
                    return jsonify(False)
            else:
                applicationJSONs = mongoFiles.delete_application_files(appName)

        return jsonify(applicationJSONs)

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
