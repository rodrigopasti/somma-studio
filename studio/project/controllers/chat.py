import requests
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


def create_channel(name):
    #name = session['user']
    r = requests.get(f'http://10.0.0.2:5000/create-channel?name={name}')
    chat_id_not_treated = r.text
    chat_id = chat_id_not_treated.replace('b', '').replace('\'', '')
    session['chat_id'] = chat_id
    return chat_id
