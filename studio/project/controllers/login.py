import hashlib
import os
from project import app
from wtforms import StringField
from wtforms.validators import DataRequired
from flask import Flask, flash, redirect, render_template, request, session, jsonify
from flask import url_for, escape, request
from project.controllers.redissession import RedisSessionInterface
from flask_wtf import FlaskForm
from flask_pymongo import MongoClient
from flask_session import Session
import json
from project.models.management import Management
from project.controllers import chat


app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()


@app.route('/register', methods=['GET', 'POST'])
def register():

    if request.method == 'GET':
        return render_template("register/register.html")
    elif request.method == 'POST':
        from project.models.login import Register
        register = Register()
        email = str(request.form['email'])
        user = hashlib.sha224(email.encode('utf-8')).hexdigest()
        pwd = hashlib.sha256(str(request.form['password']).encode('utf-8')).hexdigest()
        company = str(request.form["company"])
        request_code = str(request.form["request_code"])
        convite = register.validate_code(company, request_code)

        if convite:
            try:
                management = Management()
                management.create_user(convite, user, pwd, email)

                return jsonify(True)
            except Exception as e:
                return jsonify(False)
        else:
            return jsonify(False)


@app.route('/', methods=['GET', 'POST'])
def login():
    management = Management()

    print("\nEntered home route")
    session["logged_in"] = True
    userObj = management.getUniqueUser()
    userEmail = userObj["email"]
    user = userObj["user"]
    
    data = {}
    data["version"] = app.config["SOMMA_VERSION"]

    from project.models.login import Login
    login = Login()

    if login.is_valid(user):
        session["user"] = user
        session["email"] = userEmail

        default_plan = session.get("default_plan")       
        print('userINFO', userObj)
        return render_template("appmaker/appmaker.html", data=data)

    else:
        return 'err'

    # return False

