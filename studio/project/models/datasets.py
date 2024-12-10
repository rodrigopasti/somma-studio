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


app.config.from_object('project.config.config.ProductionConfig')

class DataSet(object):

    # Função que lê do banco

    def __init__ (self,user, pwd, maxPageSize = 1000000, maxObj = 100):
        self._user = user
        self.maxPageSize = maxPageSize
        self.maxObj = maxObj
        if app.config["RUN_MODE"] == "DEV":
            uri = app.config["MONGO_URI"] + user + app.config["DATASETS_DATABASE"]
        else:
            uri = "mongodb+srv://%s:%s@%s/%s" % (user, pwd, session.get("MONGO_HOST"), user + app.config["DATASETS_DATABASE"])

        self._mongo = MongoClient(uri)
        self.data_measures = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

        #bkt = gfs.GridFS(self._mongo[user], collection='workspace')
        #bkt.put(open("requirements.txt", "rb"),  filename="requirements.txt")
        #bkt.put(open("counts.xlsx", "rb"),  filename="counts.xlsx")
        #bkt.put(open("allpage.json", "rb"),  filename="allpage.json")


    def getMeasures(self, size):

        i = 0
        while size > 1024:
            size /= 1024
            i += 1

        return "%.2f %s" % (size, self.data_measures[i])

    def verifyCollections(self, col):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        collections = [elem for elem in db.list_collection_names(include_system_collections=False) if "workspace" not in elem]
        return len(collections) < 20 or (len(collections) == 20 and col in collections)



    def calculatePageSize(self, avgObjSize):
        self.pageSize = min(int(np.ceil(self.maxPageSize/avgObjSize)), self.maxObj)


    def get_docs_count(self, collection, query):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        col = db[collection]
        stats = db.command("collstats", collection)
        self.calculatePageSize(stats["avgObjSize"])
        count = col.find(self.__makeQuery(query[0], query[1], query[2])).count()
        pages = int(np.ceil(count/self.pageSize))
        size = stats["totalIndexSize"] + stats["storageSize"]

        return count, pages, self.getMeasures(size)

    def getDownloadDataset(self, dataset):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        col = db[dataset]
        stats = db.command("collstats", dataset)
        avgObj = stats["avgObjSize"]
        limitObj = int((5*1024*1024)/avgObj)
        return list(col.find().limit(limitObj))



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
            if params[param]["edited"]:
                bytes_code = io.BytesIO(str.encode(params[param]["code"], 'utf-8'))
                del(params[param]["code"])
                filename = params[param]["config"]["component_module"] + ".py"
                if "fromDB" in params[param]:
                    id = db.custom_components.files.find_one({"metadata.name" : params[param]["oldName"]})["_id"]
                    params[param]["oldName"] = param
                    bkt.delete(id)
                    bkt.put(bytes_code, filename=filename, metadata=params[param])
                else:

                    bkt.put(bytes_code, filename=filename, metadata=params[param])
            else:
                db.custom_components.files.update({"metadata.name" : params[param]["oldName"]}, { "$set" : {"metadata" : params[param]}})

            '''if "fromDB" in params[param] and params[param]["updateFile"] == False:
                db.custom_components.files.update({"metadata.name" : params[param]["oldName"]}, { "$set" : {"metadata" : params[param]}})
            elif "fromDB" in params[param] and params[param]["updateFile"]:
                id = db.custom_components.files.find_one({"metadata.name" : params[param]["oldName"]})["_id"]
                params[param]["oldName"] = param
                bkt.delete(id)
                bkt.put(files["component-"+param], filename=files["component-"+param].filename, metadata=params[param])
            else:
                bkt.put(files["component-"+param], filename=files["component-"+param].filename, metadata=params[param])
            '''

        return True


    '''def update_components(self, files, params):
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
    '''
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

    def verifyDatabaseSize(self, allowedSize):

        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        stats = db.command("dbstats")
        db_size = stats["storageSize"] + stats["indexSize"]
        return db_size < allowedSize



    def insert_collection(self, f, name, extension, metatributos):

        import re

        def cleanColumns(column):
            column = column.replace(".", "_")
            column = re.sub(r'[^\w]', ' ', column)
            column = re.sub( '\\s+', ' ', column).strip().replace(" ", "_")
            #column = unidecode.unidecode(column)
            nfkd_form = unicodedata.normalize('NFKD', column)
            column = u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
            return column

        def treatNulls(df):
            #df = df.apply(pd.to_numeric, errors='ignore')
            #return df.apply(lambda x: x.fillna("?") if x.dtype.kind in 'OSU' else x.fillna("X"))
            #df = df.where(pd.notnull(df), None)
            df = df.fillna(np.nan).replace([np.nan], [None])
            return df

        def readPandas(f, x, infer):
            if extension == "json":
                if infer != None:
                    df = pd.read_json(f, encoding_errors="ignore")
                else:
                    df = pd.read_json(f, dtype = "object", encoding_errors="ignore")
            elif extension == "csv":
             
                if infer != None:
                    df = pd.read_csv(f, sep=None, encoding_errors="ignore")
                else:
                    df = pd.read_csv(f, dtype="object", sep=None, encoding_errors="ignore")
            elif extension in ["xls", "xlsx"]:
                if infer != None:
                    df = pd.read_excel(f)
                else:
                    df = pd.read_excel(f, dtype="object")

            return df



        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        try:
            f.seek(0, os.SEEK_END)
            file_length = f.tell()
            if file_length > 15000000:
                return {"success" : False, "message" : "Exceeded dataset size limit"}
            f.seek(0, 0)
            data = treatNulls(readPandas(f, extension, request.form.get('infer')).rename(cleanColumns, axis='columns')).to_dict('records')


        except Exception as e:
            print(e)
            e = str(e)
            if extension == "csv" and "C error:" in e:
                return {"success" : False, "message" : "CSV Error:" + e.split("C error:")[-1]}
            if extension == "json":
                return {"success" : False, "message" : "JSON Error:" + e}
            return {"success" : False, "message" : "Invalid File"}


        '''
        dataObjects = []
        for elem in data:
            dataObject = {}
            #if "somma_datetime" not in metatributos:
            #    dataObject["somma_datetime"] = datetime.datetime.now()

            for atributo in metatributos:
                if "somma_category" not in atributo:
                        dataObject[atributo] = elem[atributo]
                else:
                    dataObject[atributo] = metatributos[atributo]

            dataObject.update(elem)
            #dataObject["somma_hash"] = None
            dataObjects.append(dataObject)
        '''

        stats = db.command("dbstats")
        db_size = stats["storageSize"] + stats["indexSize"]

        try:
            db[name].drop()

            if session.get("max_storage") > db_size + 25 * 1024 * 1024 or session.get("max_storage") > db_size + getsizeof(data):
                #print(session.get("max_storage"), db_size)
                if type(data) == list:
                    db[name].insert_many(data, ordered=False)
                else:
                    db[name].insert_one(data)

            else:
                return {"success": False, "message": "Database Limit Exceeded"}
        except Exception as e:
            if type(e) == bson.errors.InvalidDocument:
                e = str(e)
                return {"success": False, "message": "Invalid Document: " + e}
            return {"success": False, "message": "Invalid File"}

        return {"success" : True}

    def read_datasets(self, name, page, field, option, value):
        data = []
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        if name.startswith("workspace."):
            tipo = "files"
            bkt = gfs.GridFS(db, collection='workspace')
            for f in bkt.find(no_cursor_timeout=True):
                dic = {"_id" : f._id, "filename" : f.filename, "lenght" : f.length}
                dic.update(f.metadata)
                data.append(dic)
            fields = {}

        else:
            tipo = "dataset"
            col = db[name]

            query = self.__makeQuery(field, option, value)

            collection = list(col.find(query).skip(max(0, int(page)*self.pageSize)).limit(self.pageSize))
            fields = self.__getFields(collection)
            try:
                types = self.__getTypes(collection[0])

                for collect in collection:
                    data.append(collect)
            except:
                types = []
                data = []

        return data, tipo, fields, types

    def read_collections(self):
        db = self._mongo[self._user + app.config["DATASETS_DATABASE"]]
        collections = db.collection_names(include_system_collections=False)
        collections.sort()
        files = [elem for elem in collections if elem.startswith("workspace.")]
        collections = [elem for elem in collections if elem not in files]
        stats = db.command("dbstats")
        db_size = stats["storageSize"] + stats["indexSize"]
        if len(collections) > 0:
            col_avg_size = db_size/len(collections)
        else:
            col_avg_size = 0

        return collections, files, self.getMeasures(db_size), self.getMeasures(col_avg_size)

    def __makeQuery(self, field, option, value):

        operators = {"greater" : "$gt", "greater_equal" : "$gte", "less" : "$lt", "less_equal" : "$lte", "not_equals" : "$ne"}


        if None in [field, option, value] or 'None' in [field, option, value]:
            return {}
        else:
            if option == "equals":
                try:
                    return {field : int(value)}
                except:
                    try:
                        return {field : float(value)}
                    except:
                        return {field : value}
            else:
                try:
                    return {field : {operators[option] : int(value)}}
                except:
                    try:
                        return {field : {operators[option] : float(value)}}
                    except:
                        return {field : {operators[option] : value}}




    def __getFields(self, collection):

        fields = set()

        for dataObject in collection:
            fields.update(dataObject.keys())

        return list(sorted(fields))

    def __getTypes(self, dataObject):
        types = []
        for key in dataObject:
            types.append({"field" : key, "type" : str(type(dataObject[key])).split("'")[1]})
        return types
