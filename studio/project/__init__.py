# -*- coding: utf-8 -*-
__version__ = '0.2.2'
from flask import Flask
app = Flask('project')
app.config['SECRET_KEY'] = 'random'
app.debug = True
from project.controllers import *
