from project import app
from flask import request, Flask, session
from flask_session import Session
import gridfs as gfs
from werkzeug.utils import secure_filename
import os
from flask_pymongo import MongoClient
import hashlib
import json
import datetime
import numpy as np
import pandas as pd
import io
from sys import getsizeof
import bson
import unicodedata
from project.models.management import Management

app.config.from_object('project.config.config.ProductionConfig')

class Credentials(object):

    # Função que lê do banco

    def __init__(self, emp, user, pwd):
        self.management = Management()
        self._user = user
        self._emp = emp
        
        if app.config["RUN_MODE"] == "DEV":
            uri = "mongodb://%s:%s@%s/%s" % (user, pwd, session.get("MONGO_HOST"), user + app.config["DATASETS_DATABASE"])
        else:
            uri = "mongodb+srv://%s:%s@%s/%s" % (user, pwd, session.get("MONGO_HOST"), user + app.config["DATASETS_DATABASE"])
        
        self.CREDENTIALS_DATABASE = emp + hashlib.sha1("credentials".encode('utf-8')).hexdigest()[:7]
        
        self._mongo = MongoClient(uri)

    def save_credentials(self, name, users, credentials, component):

        if users == "all":
            user_ids = []
            all_users = True
        else:
            emp_id = self.management.get_emp_id(self._emp)
            user_ids = self.management.get_user_ids(emp_id, users)
            all_users = False
        
        self._mongo[self.CREDENTIALS_DATABASE][component].delete_many({"name" : name})        
        self._mongo[self.CREDENTIALS_DATABASE][component].insert_one({
            "credentials" : credentials,
            "user_ids" : user_ids,
            "all_users" : all_users,
            "name" : name
        })

    def delete_credential(self, name, component):

        self._mongo[self.CREDENTIALS_DATABASE][component].delete_many({"name": name})
    
    def list_credentials(self, component):

        user_id = self.management.get_user_id(self._user)

        credentials = self._mongo[self.CREDENTIALS_DATABASE][component].find(
            {"$or" : [
               {"all_users" : True},
               {"user_ids": {"$elemMatch": {"$eq" : user_id}}}
              ]
            },
            {"name" : 1, "_id" : 0}
        )

        return [credential["name"] for credential in credentials]

    def get_credentials(self):
        components = self._mongo[self.CREDENTIALS_DATABASE].list_collection_names()
        all_credentials = {}

        for component in components:

            credentials = list(self._mongo[self.CREDENTIALS_DATABASE][component].find(
                            {},
                            {"_id" : 0}
            ))

            for credential in credentials:
                if not credential["all_users"]:
                    credential["users"] = self.management.get_usernames(credential["user_ids"])
                del credential["user_ids"]

            all_credentials[component] = credentials
        
        return all_credentials

        


