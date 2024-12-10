#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os

from flask import Flask

app = Flask(__name__)
from flask_bootstrap import Bootstrap
Bootstrap(app)

from project import app
from project import templates
from project import  models
from project import controllers

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8081))
    app.config['MAX_CONTENT_LENGTH'] = 15 * 1024 * 1024
    app.run('0.0.0.0', port=port, debug=True)
