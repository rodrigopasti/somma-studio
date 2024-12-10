from pymongo import MongoClient
import pymongo
import hashlib
from atlasapi.atlas import Atlas
from atlasapi.specs import DatabaseUsersPermissionsSpecs, RoleSpecs
import os

adm_db = os.environ["ADM_DATABASE"]

MONGO_IP = "mongodb://localhost"
LOGS_DATABASE = hashlib.sha1("logs".encode('utf-8')).hexdigest()[:7]
DEFINITIONS_DATABASE = hashlib.sha1("definitions".encode('utf-8')).hexdigest()[:7]
DATASETS_DATABASE = hashlib.sha1("datasets".encode('utf-8')).hexdigest()[:7]
LOGS_EMP = hashlib.sha1("logs_emp".encode('utf-8')).hexdigest()[:7]
DEFINITIONS_EMP = hashlib.sha1("definitions_emp".encode('utf-8')).hexdigest()[:7]
DATASETS_EMP = hashlib.sha1("datasets_emp".encode('utf-8')).hexdigest()[:7]

auth = False

mongo = MongoClient(MONGO_IP)

cluster = "dev"
URI = "localhost"
URI_replicas = "localhost"
mongo[adm_db].clusters.insert_one({"name": cluster, "URI": URI, "URI_replicas" : URI_replicas, "nb_users" : 1})


plano = "dev"
cpu = 8
memory = 4
bandwidth = 2
mongo[adm_db].planos.insert_one({"name": plano, "cpu" : cpu, "memory" : memory, "bandwidth" : bandwidth})

name = str(input("Digite o nome da empresa \n"))
empresa = mongo[adm_db].empresas.find_one({"name" : name})

if not empresa:
    emp_user = hashlib.sha224(name.encode('utf-8')).hexdigest()
    planos = list(mongo[adm_db].planos.find())
    i = 0
    print("Escolha os planos de execução, separados por vírgulas (ex: 0,1,2): \n")
    for plano in planos:
        print("%i) %s (CPUs: %s, Memória: %s)" % (i, plano["name"], plano["cpu"], plano["memory"]))
        i += 1
    plano_escolhido = str(input())
    planos_escolhidos = [planos[int(elem)]["_id"] for elem in plano_escolhido.split(",")]
    print("Escolha os planos de execução de administrador, separados por vírgulas (ex: 0,1,2): \n")
    plano_escolhido = str(input())
    adm_planos_escolhidos = [planos[int(elem)]["_id"] for elem in plano_escolhido.split(",")]
    clusters = list(mongo[adm_db].clusters.find())
    i = 0
    print("Escolha os clusters de execução, separados por vírgulas: \n")
    for cluster in clusters:
        print("%i) %s (número de usuários: %s)" % (i, cluster["name"], cluster["nb_users"]))
        i += 1
    cluster_escolhido = str(input())
    clusters_escolhidos = [clusters[int(elem)]["_id"] for elem in cluster_escolhido.split(",")]
    mongo[adm_db].empresas.insert_one({"name" : name, "ids_planos" : planos_escolhidos, "ids_adm_planos" : adm_planos_escolhidos, "ids_clusters" : clusters_escolhidos, "nb_users" : 0, "emp_user" : emp_user})
    empresa = mongo[adm_db].empresas.find_one({"name" : name})

emp_user = empresa["emp_user"]

while True:
    email = str(input("Digite o usuário \n"))

    if email == "-1":
        break

    tipo = str(input("Digite o tipo do usuário (1 para admin, 0 para usuário): "))
    user = hashlib.sha224(email.encode('utf-8')).hexdigest()
    pwd = hashlib.sha256(str(input("Digite a senha \n")).encode('utf-8')).hexdigest()
    record = {"user" : user, "email" : email, "id_empresa" : empresa["_id"], "admin" : True if tipo == "1" else False}

    mongo[user + DATASETS_DATABASE].command("createUser", user, pwd=pwd, roles=["dbOwner"])
    mongo[user + LOGS_DATABASE].command("createUser", user, pwd=pwd, roles=["dbOwner"])
    mongo[user + DEFINITIONS_DATABASE].command("createUser", user, pwd=pwd, roles=["dbOwner"])


    mongo[adm_db].users.insert_one(record)
    mongo[adm_db].empresas.update_one({"_id" : empresa["_id"]}, {"$inc" : {"nb_users" : 1}})
    mongo[adm_db].clusters.update_one({"_id" : empresa["ids_clusters"][-1]}, {"$inc" : {"nb_users" : 1}})


    print("User: ", user)
    print("Dataset: ", user + DATASETS_DATABASE)
    print("Log:", user + LOGS_DATABASE)
    print("Definitions: ", user + DEFINITIONS_DATABASE)
