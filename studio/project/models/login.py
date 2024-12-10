import hashlib
from flask import request, Flask, session
from flask_session import Session
from flask_pymongo import MongoClient
from project import app
from project.models.management import Management
import os



app.config.from_object('project.config.config.ProductionConfig')


class Register(object):

    def validate_code(self, company, request_code):

        adm = os.environ["SOMMA_ADM"]
        pwd = os.environ["SOMMA_PWD"]
        host = os.environ["SOMMA_HOST"]
        adm_db = os.environ["ADM_DATABASE"]

        MONGO_IP = "mongodb+srv://%s:%s@%s/%s" % (adm, pwd, host, adm_db)
        mongo = MongoClient(MONGO_IP)
        try:
            empresa = mongo[adm_db].empresas.find({"name": company})[0]
        except Exception as e:
            print(e)
            return False

        try:
            return mongo[adm_db].convites.find({"id_empresa": empresa["_id"], "convite": request_code, "utilizacoes": {"$gt": 0}})[0]
        except Exception as e:
            print(e)
            return False

class Login(object):
    '''
        Esta classe e resposável pelo login. O método is_valid tem como objetivo fazer o login do usúario ou
        redirecionando para o cadastro de usuário.
    '''

    def verify_flags(self, user, emp_user, management):

        self.verify_and_update_workspace(user, emp_user, management)
        self.verify_and_update_credential(user, emp_user, management)



    def verify_and_update_workspace(self, user, emp_user, management):

        if management.verify_workspace_update(user):
            try:
                management.update_workspace(user, emp_user)
            except:
                return False

        return True

    def verify_and_update_credential(self, user, emp_user, management):

        if management.verify_credential_update(user):
            try:
                management.update_credential(user, emp_user)
            except:
                return False

        return True

    def is_valid(self, user, simple_login = False):
        management = Management()
    
        user_info = management.getUserInfo(user)

        clusters = user_info["clusters"]
        for cluster in clusters:
            
            uri = app.config["MONGO_URI"]
            client = MongoClient(app.config["MONGO_URI"])
            
            try:
                client[user + app.config["DEFINITIONS_DATABASE"]].test.find_one()

                if not simple_login:
                    session["MONGO_HOST"] = uri
                    session["planos"] = [plano for plano in user_info["planos"] if "cloud_provider" in plano and plano["cloud_provider"] in ["somma"]]
                    session["all_planos"] = management.get_all_plans(user_info["empresa"][0]["emp_user"])
                    session["max_executions"] = user_info["empresa"][0]["max_executions_per_user"] if app.config["RUN_MODE"] != "DEV" else 5
                    session["max_storage"] = user_info["empresa"][0]["max_storage_per_user"] if app.config["RUN_MODE"] != "DEV" else float("inf")
                    session["emp_user"] = user_info["empresa"][0]["emp_user"]
                    session["company"] = user_info["empresa"][0]["name"]
                    session["default_plan"] = user_info["default_plan"][0]["name"] if user_info["default_plan"] != [] else ""#user_info["default_plan"][0]["name"] if "default_plan" in user_info else ""
                    session["boot_machine_on_login"] = user_info["empresa"][0]["boot_machine_on_login"] if "boot_machine_on_login" in user_info["empresa"][0] else False

                    # self.verify_flags(user, pwd, session["emp_user"], management)

                return True
            except Exception as e:
                print(e)
                if "Authentication failed" in str(e):
                    print("Authentication failed")
                pass
        return False
