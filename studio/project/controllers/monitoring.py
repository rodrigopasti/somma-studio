from project import app
from flask import request, render_template, jsonify, session
from project.models.management import Management
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
from pprint import pprint
import json

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/get-used-servers', methods=['GET'])
def get_used_servers():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'GET':

                management = Management()

                emp_user = session.get("emp_user")
                user = session.get("user")                
                used_servers = management.get_used_servers(emp_user)
                return jsonify(used_servers)
        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})



