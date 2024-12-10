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


@app.route('/update-user', methods=['POST'])
def updateUserinfo():
    if session.get('logged_in'):

        if request.method == 'POST':

            management = Management()

            data = request.values.to_dict()
            user = session.get("user")
            email = session.get("email")
            if "email" in data:
                del data["email"]

            management.updateUserInfo(user, data)

            return data
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]}, isValidCredentials=True)


@app.route('/get-user-info', methods=['GET'])
def getUserInfo():
    if session.get('logged_in'):

        if request.method == 'GET':
            publicInfo = {}
            management = Management()
            user = session.get("user")
            resp = management.getInfoByUser(user)
            publicInfo = {key: value for (key, value) in resp.items() if key in [
                "name", "email", "phone", "role", 'max_prompt']}

            publicInfo["company"] = session.get("company")

            return publicInfo
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]}, isValidCredentials=True)


@app.route('/update-password', methods=['POST'])
def updatePassword():
    if session.get('logged_in'):

        if request.method == 'POST':
            user = session.get("user")
            data = request.values.to_dict()
            old_pwd = hashlib.sha256(
                data['old_pw'].encode('utf-8')).hexdigest()
            new_pwd = hashlib.sha256(
                data['new_pw'].encode('utf-8')).hexdigest()
            management = Management()


            status = management.update_user_password(user, old_pwd, new_pwd)

            if status == "password updated":
                session["pwd"] = new_pwd

            return status

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]}, isValidCredentials=True)
