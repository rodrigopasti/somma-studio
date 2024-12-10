from project import app
from flask import request, render_template, jsonify, session
from project.models.mongo_files import MongoFiles
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/applications', methods=['GET'])
def applications():
    '''
    Esta rota é responsável pelos dados das aplicações.
    Faz a leitura para mostrar no menu de aplicações (My Applications)
    '''
    
    if session.get('logged_in'):

        if request.method == 'GET':
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            '''
            Fazer a leitura de todas as aplicações existentes
            '''

            data = request.values.to_dict()

            if "type" in data and data["type"] == "workspace":
                if data["workspace"] == "default":
                    workspace = str(session.get("emp_user"))
            else:
                workspace = str(session.get("user"))

            applicationsInfo = mongoFiles.load_applications_info(workspace)
            return jsonify(applicationsInfo)

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/clone-application', methods=['GET'])
def clone_application():

    if session.get('logged_in'):
        data = request.values.to_dict()
        
        mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))

        workspace = str(session.get("emp_user")) if data["workspace"] == "default" else ""

        author = str(session.get("email"))

        try:
            newName = mongoFiles.verify_applications(data["app_name"], str(session.get("user")))
        except:
            return jsonify(message="Maximum number of clones of this application reached"),405

        if mongoFiles.clone_application(data["app_name"], newName, workspace, author, "from_workspace"):
            return mongoFiles.load_applications_info(str(session.get("user")), appName = newName)
        return jsonify(message="Application not cloned, might been erased by author"),405



    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})

@app.route('/upload-application', methods=['POST'])
def upload_application():

    if session.get('logged_in'):
        data = request.values.to_dict()
        
        mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))

        author = str(session.get("email"))

        workspace = str(session.get("emp_user")) if data["workspace"] == "default" else ""

        newName = mongoFiles.verify_workspace_applications(data["app_name"], workspace, author)
        
        return jsonify(mongoFiles.clone_application(data["app_name"], newName, workspace, author, "to_workspace"))
        
            

        
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
