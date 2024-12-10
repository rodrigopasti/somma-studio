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

app.config.from_object('project.config.config.ProductionConfig')

class DataSet(object):
    # Função que lê do banco

    def __init__ (self,user, pwd, maxPageSize = 1000000, maxObj = 100):
        self._user = user
        self._mongo = MongoClient(session.get("MONGO_HOST"), app.config["MONGO_PORT"])
        self._mongo[user + app.config["DEFINITIONS_DATABASE"]].authenticate(user, pwd, mechanism='SCRAM-SHA-1')
        self._mongo[user + app.config["DATASETS_DATABASE"]].authenticate(user, pwd, mechanism='SCRAM-SHA-1')
        self.maxPageSize = maxPageSize
        self.maxObj = maxObj
        #bkt = gfs.GridFS(self._mongo[user], collection='workspace')
        #bkt.put(open("requirements.txt", "rb"),  filename="requirements.txt")
        #bkt.put(open("counts.xlsx", "rb"),  filename="counts.xlsx")
        #bkt.put(open("allpage.json", "rb"),  filename="allpage.json")


    def calculatePageSize(self, avgObjSize):
        self.pageSize = min(int(np.ceil(self.maxPageSize/avgObjSize)), self.maxObj)

    def get_docs_count(self, collection):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        col = db[collection]
        stats = db.command("collstats", collection)
        self.calculatePageSize(stats["avgObjSize"])
        count = col.find().count()
        pages = int(count/self.pageSize)
        return count, pages

    def delete_dataset(self, dataset_name):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        return db.drop_collection(dataset_name)["ok"] == 1


    def delete_component(self, name):
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        bkt = gfs.GridFS(db, collection='custom_components')
        try:
            id = db.custom_components.files.find_one({"metadata.name" : name})["_id"]
            bkt.delete(id)
            return True
        except:
            return False


    def update_components(self, files, params):
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        bkt = gfs.GridFS(db, collection='custom_components')
        for param in params:
            if "fromDB" in params[param] and params[param]["updateFile"] == False:
                db.custom_components.files.update({"metadata.name" : params[param]["oldName"]}, { "$set" : {"metadata" : params[param]}})
            elif "fromDB" in params[param] and params[param]["updateFile"]:
                id = db.custom_components.files.find_one({"metadata.name" : params[param]["oldName"]})["_id"]
                params[param]["oldName"] = param
                bkt.delete(id)
                bkt.put(files["component-"+param], filename=files["component-"+param].filename, metadata=params[param])
            else:
                bkt.put(files["component-"+param], filename=files["component-"+param].filename, metadata=params[param])

        return True

    def read_components(self):
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        bkt = gfs.GridFS(db, collection='custom_components')
        data = []
        for f in bkt.find(no_cursor_timeout=True):
            dic = {"filename" : f.filename}
            dic.update(f.metadata)
            data.append(dic)
        return data

    def save_file(self, f, name,  metatributos):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        bkt = gfs.GridFS(db, collection='workspace')
        bkt.put(f, filename = secure_filename(name), metadata = metatributos)
        return True

    def insert_collection(self, f, name, extension, metatributos):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        if extension == "json":
            data = json.load(f)
        if extension == "csv":
            data = pd.read_csv(f).to_dict('records')
        if extension in ["xls", "xlsx"]:
            data = pd.read_excel(f).to_dict('records')

        dataObjects = []
        for elem in data:
            dataObject = {}
            if "somma_datetime" not in metatributos:
                dataObject["somma_datetime"] = datetime.datetime.now()

            for atributo in metatributos:
                if "somma_category" not in atributo:
                        dataObject[atributo] = elem[atributo]
                else:
                    dataObject[atributo] = metatributos[atributo]

            dataObject.update(elem)
            dataObject["somma_hash"] = None
            dataObjects.append(dataObject)

        db[name].insert_many(dataObjects, ordered=False)

        return True

    def read_datasets(self, name, page):
        data = []
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        if name.startswith("workspace."):
            tipo = "files"
            bkt = gfs.GridFS(db, collection='workspace')
            for f in bkt.find(no_cursor_timeout=True):
                dic = {"_id" : f._id, "filename" : f.filename, "lenght" : f.length}
                dic.update(f.metadata)
                data.append(dic)
        else:
            tipo = "dataset"
            col = db[name]

            collection = col.find().skip(int(page)*self.pageSize).limit(self.pageSize)

            for collect in collection:
                data.append(collect)

        return data, tipo

    def read_collections(self):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        collections = db.collection_names(include_system_collections=False)
        files = [elem for elem in collections if elem.startswith("workspace.")]
        collections = [elem for elem in collections if elem not in files]
        #print(collection)
        return collections, files
