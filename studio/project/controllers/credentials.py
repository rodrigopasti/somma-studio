from project import app
from flask import Flask, flash, redirect, render_template, request, session, jsonify, send_from_directory, send_file
from flask import url_for, escape, request
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
from project.models.credentials import Credentials
import json
import os
import requests
import pandas as pd
import os
from project.models.management import Management


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/get-credentials', methods=['GET'])
def get_credentials():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):
        if session.get("admin"):
            credentials = Credentials(str(session.get("emp_user")), str(session.get("user")), str(session.get("pwd")))
            return jsonify(credentials.get_credentials())
        else:
            return "Not authorized"
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})


@app.route('/save-credentials', methods=['POST'])
def save_credentials():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):
        if session.get("admin"):

            data = json.loads(list(request.values.to_dict())[0])

            credentials = Credentials(str(session.get("emp_user")), str(session.get("user")), str(session.get("pwd")))
            credentials.save_credentials(data["credentialName"], 
                                         data["users"], 
                                         data["credentials"], 
                                         data["component"])

            return jsonify(credentials.get_credentials())
        else:
            return "Not authorized"
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})


@app.route('/delete-credential', methods=['POST'])
def delete_credential():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):
        if session.get("admin"):

            data = json.loads(list(request.values.to_dict())[0])

            credentials = Credentials(str(session.get("emp_user")), str(
                session.get("user")), str(session.get("pwd")))

            credentials.delete_credential(data["credentialName"], data["component"])

            return jsonify(True)
        else:
            return "Not authorized"
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})



@app.route('/list-credentials', methods=['GET'])
def list_credentials():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):

        data = json.loads(list(request.values.to_dict())[0])

        credentials = Credentials(str(session.get("emp_user")), str(session.get("user")), str(session.get("pwd")))
        return jsonify(credentials.list_credentials(data["component"]))

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})
