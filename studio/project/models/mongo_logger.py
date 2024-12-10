from pymongo import MongoClient
from gridfs import GridFS
import bson
from project import app
from project.models.management import Management
from flask import session


class MongoLogger(object):

    def __init__ (self, applicationName, schemaName, user, pwd):
        self.schemaName = schemaName
        self.applicationName = applicationName
        self._user = user
        if app.config["RUN_MODE"] == "DEV":
            uri = app.config["MONGO_URI"] + user + app.config["LOGS_DATABASE"]
        else:
            uri = "mongodb+srv://%s:%s@%s/%s" % (user, pwd, session.get("MONGO_HOST"), user + app.config["LOGS_DATABASE"])

        self._mongo = MongoClient(uri)


    def delete_logs(self):
        #Limpando logs
        db = self._mongo[self._user + app.config["LOGS_DATABASE"]]
        logCollection = db[self.applicationName + "-xx-" + self.schemaName]
        logCollection.drop()


    def load_progress(self, runMode):
        '''
        Faz a leitura do progresso de execução
        '''
        db = self._mongo[self._user + app.config["LOGS_DATABASE"]]
        logCollection = db[self.applicationName + "-xx-" + self.schemaName]
        progressLog = []
        with self._mongo.start_session() as session:
            with session.start_transaction():
                logsFound = list(logCollection.find({"readFlag" : {"$exists" : False}}))
                ids = []
                for log in logsFound:
                    ids.append(log["_id"])
                    del(log["_id"])
                logCollection.update_many({"_id": {"$in": ids}}, {"$set" : {"readFlag" : True}})

        #print(logsFound)
        #for log in logsFound:
        #    progressLog.append(log)

        return logsFound
