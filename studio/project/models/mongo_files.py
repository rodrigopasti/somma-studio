from pymongo import MongoClient
from gridfs import GridFS
import bson
from project import app
from flask_session import Session
from flask import session, jsonify
from flask_session import Session
from bson import ObjectId


class MongoFiles(object):

    def __init__ (self, user, pwd):
        self._user = user

        if app.config["RUN_MODE"] == "DEV":
            uri = app.config["MONGO_URI"] + user + app.config["DEFINITIONS_DATABASE"]
        else:
            uri = "mongodb+srv://%s:%s@%s/%s" % (user, pwd, session.get("MONGO_HOST"), user + app.config["DEFINITIONS_DATABASE"])

        self._mongo = MongoClient(uri)


    def load_custom_code(self):
        '''
        Faz a leitura do banco de todos os componentes do banco de dados
        '''
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        gridFS = GridFS(db, collection="custom_components")
        filesFound = gridFS.find({})
        filesContent = {}
        for file in filesFound:
            fileR = file.read().decode("utf-8")
            filesContent[file.metadata["template"]["id_name"]] = fileR
        return filesContent


    def save_application_info(self, applicationInfo):
        applicationName = applicationInfo["application_name"]
        '''
        Salva JSON de Info da aplicação (quando cria nova ou altera info)
        '''
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        gridFS = GridFS(db, collection=applicationName)
        metaData = {}
        metaData["somma_file_type"] = "application_definition"
        #metaData["file_type"] =
        if gridFS.exists({"filename":"info.json"}):
            filesFound = gridFS.find({"filename":"info.json"})
            for fileFound in filesFound:
                gridFS.delete(fileFound._id)
        gridFS.put(bson.BSON.encode(applicationInfo), filename="info.json", metadata = metaData)

    def rename_application(self, oldName, newName):
        '''
        Renomeia as collections do nome de aplicação (+ collections de log)
        '''
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]

        db_logs = self._mongo[self._user + app.config["LOGS_DATABASE"]]
        collectionsList = db_logs.list_collection_names()
        collectionsListFiltered = [coll for coll in collectionsList if coll.split("-xx-")[0] == oldName]

        try:
            db[oldName + ".files"].rename(newName + ".files")
            db[oldName + ".chunks"].rename(newName + ".chunks")
            for coll in collectionsListFiltered:
                db_logs[coll].rename(newName + "-xx-" + coll.split("-xx-")[1])

            return "true"
        except:
            return "false"



            '''
            Apagar collections de logs (nome da aplicacao + schema)
            '''
            collectionsListFiltered = [coll for coll in collectionsList if coll.split("-xx-")[0] == applicationName]
            statusLoggerColl = 1
            for coll in collectionsListFiltered:
                status = db.drop_collection(coll)
                if status["ok"] == 0:
                    statusLoggerColl = 0



    def verify_workspace_applications(self, appName, workspace, author):

        apps = self.load_applications_info(workspace)

        originalName = appName.rsplit("*", 1)[0]

        if originalName not in apps:
            return originalName
        elif appName in apps and apps[appName]["author"] == author:
            return appName
        else:
            for i in range(2, 100):
                appName = "%s*%d" % (originalName, i)
                if appName not in apps or apps[appName]["author"] == author:
                    return appName
    
        '''i = 2
        while appName in apps:
            if apps[appName]["author"] == author:
                return appName
            appName = "%s %d" % (originalName, i)
            i += 1'''

        return appName

    def verify_applications(self, appName, workspace):

        apps = self.load_applications_info(workspace)
        originalName = appName.rsplit("*", 1)[0]

        if originalName not in apps:
            return originalName
        else:
            for i in range(2, 100):
                appName = "%s*%d" % (originalName, i)
                if appName not in apps:
                    return appName
        
        raise Exception()

        

    def verify_workspace_authorship(self, appName, workspace, author):

        apps = self.load_applications_info(workspace)
        try:
            return apps[appName]["author"] == author
        except:
            return False



    def clone_application(self, appName, newName, workspace, author, option):

        if option == "to_workspace":
            db_origin = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
            db_destination = self._mongo[workspace + app.config["DEFINITIONS_DATABASE"]]
        elif option == "from_workspace":
            db_origin = self._mongo[workspace + app.config["DEFINITIONS_DATABASE"]]
            db_destination = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]

        db_destination[newName + ".chunks"].drop()
        db_destination[newName + ".files"].drop()

        #print(list(db_origin[appName + ".chunks"].find()))
        #print(list(db_origin[appName + ".files"].find()))
        [db_destination[newName + ".chunks"].insert_one(elem) for elem in db_origin[appName + ".chunks"].find()]
        [db_destination[newName + ".files"].insert_one(elem) for elem in db_origin[appName + ".files"].find()]

        gridFS = GridFS(db_destination, collection=newName)
        metaData = {}
        metaData["somma_file_type"] = "application_definition"


        fileFound = gridFS.find_one({"filename":"info.json"})
        try:
            data = bson.BSON.decode(fileFound.read())
            data["application_name"] = newName
            data["author"] = author

            gridFS.delete(fileFound._id)
            gridFS.put(bson.BSON.encode(data), filename="info.json", metadata = metaData)
        except:
            return False

        return True



    def load_applications_info(self, workspace, appName = ""):
        '''
        Salva arquivo de informações da aplicação
        '''
        db = self._mongo[workspace + app.config["DEFINITIONS_DATABASE"]]
        if appName == "":
            collectionsNamesOriginal = db.list_collection_names()
            collectionsNames = []
            for collName in collectionsNamesOriginal:
                collectionsNames.append(collName.split(".")[0])
            collectionsNames = list(set(collectionsNames))
        else:
            collectionsNames = [appName]

        applicationsInfo = {}
        for collName in collectionsNames:
            if collName not in ["custom_components", "user_info"]:
                gridFS = GridFS(db, collection=collName)
                query = {"metadata.somma_file_type": "application_definition", "filename":"info.json"}
                try:
                    applicationsInfo[collName] = bson.BSON.decode(gridFS.find_one(query).read())
                except:
                    continue
        return applicationsInfo


    def save_application_files(self, applicationJSONs, applicationName):
        '''
        Salva os arquivos da aplicação - dicionarios (JSONs)
        '''
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        gridFS = GridFS(db, collection=applicationName)

        #Faz a separação dos JSONs para salvar em arquivo
        coreSchemas = applicationJSONs["core_schemas"]
        studioSchemas = applicationJSONs["studio_schemas"]
        #schemasAliases = applicationJSONs["schemas_aliases"]
        #requests = applicationJSONs["requests"]
        #info = applicationJSONs["info"]

        metaData = {}
        metaData["somma_file_type"] = "application_definition"
        #metaData["file_type"] =
        if gridFS.exists({"metadata.somma_file_type": "application_definition"}):
            filesFound = gridFS.find({"metadata.somma_file_type": "application_definition"})
            for fileFound in filesFound:
                if fileFound.filename != "info.json":
                    gridFS.delete(fileFound._id)
        gridFS.put(bson.BSON.encode(coreSchemas), filename="core_schemas.json", metadata = metaData)
        gridFS.put(bson.BSON.encode(studioSchemas), filename="studio_schemas.json", metadata = metaData)
        #gridFS.put(bson.BSON.encode(schemasAliases), filename="schemas_aliases.json", metadata = metaData)
        #gridFS.put(bson.BSON.encode(requests), filename="requests.json", metadata = metaData)
        #gridFS.put(bson.BSON.encode(info), filename="info", metadata = metaData)


    def load_application_files(self, applicationName):
        '''
        Faz a leitura dos arquivos da aplicação
        '''
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        gridFS = GridFS(db, collection=applicationName)
        applicationJSONs = {}
        '''
        Dada a aplicação corrente fazer a busca pelos seus arquivos
        '''
        filesFound = gridFS.find({"metadata.somma_file_type": "application_definition"})
        for fileFound in filesFound:
            if fileFound.filename != "core_schemas.json":
                applicationJSONs[fileFound.filename.split(".")[0]] = bson.BSON.decode(fileFound.read())

        return applicationJSONs

    def delete_shared_application(self, applicationName, workspace):
        '''
        Apaga todos os arquivos de uma aplicação compartilhada
        '''
        db = self._mongo[workspace + app.config["DEFINITIONS_DATABASE"]]
        statusFiles = db.drop_collection(applicationName+".files")
        statusChunks = db.drop_collection(applicationName+".chunks")
        return statusFiles["ok"] == 1 and statusChunks["ok"] == 1
        #return db.drop_collection(applicationName)["ok"] == 1


    def delete_application_files(self,applicationName):
        '''
        Apaga todos os arquivos de uma aplicação
        '''
        deleteOk = False
        db = self._mongo[self._user + app.config["LOGS_DATABASE"]]
        collectionsList = db.list_collection_names()

        '''
        Apagar collections de logs (nome da aplicacao + schema)
        '''
        collectionsListFiltered = [coll for coll in collectionsList if coll.split("-xx-")[0] == applicationName]
        statusLoggerColl = 1
        for coll in collectionsListFiltered:
            status = db.drop_collection(coll)
            if status["ok"] == 0:
                statusLoggerColl = 0

        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        statusFiles = db.drop_collection(applicationName+".files")
        statusChunks = db.drop_collection(applicationName+".chunks")
        return statusFiles["ok"] == 1 and statusChunks["ok"] == 1 and statusLoggerColl == 1
        #return db.drop_collection(applicationName)["ok"] == 1

    def load_models(self, applicationName, componentName):

        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]

        return list(db[applicationName + ".files"]
                    .aggregate([
                                {"$match" : {"metadata.component_name" : componentName,
                                                "metadata.somma_file_type" : "model"}},
                                {"$group" : {
                                    "_id" : "$metadata.model_name",
                                    "models" : {"$push" : {"date" : "$uploadDate",
                                                            "selected_model" : "$metadata.selected_model",
                                                            "model_id": {"$toString": "$_id"},
                                                            "metric_name" : "$metadata.metric_name",
                                                            "metric" : "$metadata.metric",
                                                            "description" : "$metadata.description",
                                                            "learned_dataset" : "$metadata.dataset"
                                                            }}
                                            }
                                }
                            ]))

    def delete_selected_models(self, applicationName, modelsIds):
        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]
        for _id in modelsIds:
            register = db[applicationName + ".files"].find_one({"_id" : ObjectId(_id)})
            try:
                db[applicationName + ".files"].delete_one(register)
            except:
                continue
        return jsonify(True)

    def save_selected_models(self, applicationName, componentName, modelsIds):

        db = self._mongo[self._user + app.config["DEFINITIONS_DATABASE"]]

        for _id in modelsIds:
            register = db[applicationName + ".files"].find_one({"_id" : ObjectId(_id)})
            try:
                db[applicationName + ".files"].update_many({"metadata.component_name" : componentName,
                                                        "metadata.model_name" : register["metadata"]["model_name"]},
                                                        {"$set" : {"metadata.selected_model" : False}})
                db[applicationName + ".files"].update_one({"_id" : ObjectId(_id)},
                                            {"$set" : {"metadata.selected_model" : True}})
            except:
                continue
