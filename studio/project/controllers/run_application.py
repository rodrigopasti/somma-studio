import string
import random
from project import app
from flask import request, render_template, session, jsonify
import json
import os
import subprocess
from project.models.mongo_logger import MongoLogger
from project.controllers.redissession import RedisSessionInterface
from project.controllers.aws import EC2
from project.controllers.remote import Remote
from project.controllers.atlas import AtlasApi
from project.models.management import Management
from project.models.datasets import DataSet
from flask_session import Session
import os
import time
from bson.objectid import ObjectId
import docker
import boto3
from botocore.exceptions import ClientError

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

core_images = {"0.11.0": "ami-03853a8139d93f565"}

def createConfig(plano, container = "", machine = "", machine_id = "", app_id = ""):
    mongo_host = session.get("MONGO_HOST")
    user = str(session.get("user"))
    pwd = str(session.get("pwd"))

    if plano == "dev":
        plano = {}
        plano["memory"] = 8
        plano["cpu"] = 4
    if app.config["RUN_MODE"] == "DEV":
        host = mongo_host
    else:
        host = "mongodb+srv://%s:%s@%s/" % (user, pwd, mongo_host)

    return {
        "dev_mode" : app.config["RUN_MODE"] == "DEV",
        "run_mode": app.config["RUN_MODE"],
        "max_storage": session.get("max_storage"),
        "database_config": {
            "host": host,
            "URI": host,
            "user": user,
            "pwd": pwd,
            "logs_database": user + app.config["LOGS_DATABASE"],
            "datasets_database": user + app.config["DATASETS_DATABASE"],
            "definitions_database": user + app.config["DEFINITIONS_DATABASE"]
        },

        "spark": {
                "enabled": True,
                "executor_memory": "%.0fm" % ((int(plano["memory"])/2) * 1024),
                "max_results_size": "%.0fm" % ((int(plano["memory"]) * 0.2) * 1024),
                "driver_memory": "%.0fm" % ((int(plano["memory"])/2) * 1024)
            },
        "total_memory" : plano["memory"],
        "total_cpu" : plano["cpu"],
        "somma_temp_path": "/sfiles/spark-model",
        "container" : container,
        "machine" : machine,
        "machine_id" : machine_id,
        "app_id" : app_id,
        "emp_user": session.get("emp_user")
    }


def randomString(stringLength=20):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))


@app.route('/get-running-application', methods=['GET'])
def get_application():
    if session.get('logged_in'):
        user = str(session.get("user"))
        management = Management()

        data = request.values.to_dict()

        try:
            return jsonify(management.getLastExecution(user, data["app_name"], data["schema_name"]))
        except Exception as e:
            return jsonify(False)

@app.route('/delete-logs', methods=['POST'])
def delete_logs():
    if session.get('logged_in'):

        if request.method == 'POST':

            data = str(request.values)
            data = data.replace("CombinedMultiDict([ImmutableMultiDict([('", "")
            data = data.replace("', '')]), ImmutableMultiDict([])])", "")
            appInfo = json.loads(data)

            #appName = str(request.args.get("application_name", ""))
            appName = appInfo["application_name"]
            mongoLogger = MongoLogger(appName, appInfo["schema_name"], str(session.get("user")), str(session.get("pwd")))
            mongoLogger.delete_logs()
            return jsonify(True)

@app.route('/run-application', methods=['POST'])
def run_application():
    '''
    Esta rota é responsável pelo controle de execução da aplicação
    '''

    if session.get('logged_in'):

        if request.method == 'POST':

            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = str(request.values)
            data = data.replace(
                "CombinedMultiDict([ImmutableMultiDict([('", "")
            data = data.replace("', '')]), ImmutableMultiDict([])])", "")
            runJSON = json.loads(data)


            user = str(session.get("user"))
            email = str(session.get("email"))
            pwd = str(session.get("pwd"))

            '''
            print("======================")
            print(runJSON)
            print(user)
            print(email)
            print(pwd)
            print(session.get("planos"))
            '''

            if not DataSet(user, pwd).verifyDatabaseSize(session.get("max_storage")):
                return "Database Limit Exceeded"

            if app.config["RUN_MODE"] == "DEV":
                runJSON["plan"] = "dev.dev"

            #cloud aqui definida pelo plano. Se for somma, a cloud é somma e os servidores podem estar em vários cloud_provider
            cloud = runJSON["plan"].split(".")[0]

            if cloud not in ["oracle", "aws"]:

                if not any(runJSON["plan"] == elem["name"] for elem in session.get("planos")) and app.config["RUN_MODE"] != "DEV":
                    return "Plan Not Allowed"
                else:
                    for elem in session.get("planos"):
                        if runJSON["plan"] == elem["name"]:
                            plano = elem

            for elem in session.get("all_planos"):
                if runJSON["plan"] == elem["name"]:
                    plano = elem

            management = Management()

            if runJSON["plan"].startswith("somma") or runJSON["plan"].startswith("axon"):
                #Descobrir IPs dos servidores Freemium
                machinesList = management.find_somma_machines()
                planDetails = runJSON["plan"].split(".")
                if len(planDetails) > 2:
                    if planDetails[2] != "dev":
                        cloudInPlan = [planDetails[2]]
                        regionInPlan = planDetails[3]
                    else:
                        cloudInPlan = ["oracle", "digitalocean", "aws"]
                else:
                    cloudInPlan = ["oracle", "digitalocean", "aws"]
                #De posse dos IPS, consultar cada um deles sobre a memória e CPU
                memoryStats = []
                for mac in machinesList:
                    if mac["cloud_provider"] in cloudInPlan:
                        if mac["cloud_provider"] == "oracle":
                            cloud_user = "opc"
                            key_path = "/tmp/oracle.key"
                        elif mac["cloud_provider"] == "digitalocean":
                            cloud_user = "root"
                            key_path = "/tmp/digital_ocean"
                        elif mac["cloud_provider"] == "aws":
                            cloud_user = "centos"
                            key_path = "/tmp/centos_ec2.pem"

                        mem = management.check_memory(mac["ip"], cloud_user, key_path)
                        memoryStats.append(mem["free"])
                    else:
                        memoryStats.append(0)

                #Escolher o servidor que tem menor uso de recursos
                machine = machinesList[memoryStats.index(max(memoryStats))]["name"]
                ip = machinesList[memoryStats.index(max(memoryStats))]["ip"]
                cloud_provider = machinesList[memoryStats.index(max(memoryStats))]["cloud_provider"]

                #Escolhido o servidor, pegar os devidos acessos
                if cloud_provider == "oracle":
                    cloud_user = "opc"
                    key_path = "/tmp/oracle.key"
                elif cloud_provider == "digitalocean":
                    cloud_user = "root"
                    key_path = "/tmp/digital_ocean"
                elif cloud_provider == "aws":
                    cloud_user = "centos"
                    key_path = "/tmp/centos_ec2.pem"

            else:
                machine = runJSON["plan"].split(".", 1)[-1]


            dev = True if runJSON["plan"].split(".")[-1] in ["dev", "alpha", "beta"] else False

            #machine = management.getResource(plano)
            #if not machine:
            #    return "No Resource Capacity"

            '''
            Acionando backend
            '''
            container = user + runJSON["app_id"]

            if app.config["RUN_MODE"] == "DEV":

                ''' Nova maneira de rodar no DEV '''

                #os.system("mkdir -p /tmp/%s/sfiles/cc" % str(session.get("user")))

                #with open("/tmp/%s/sfiles/somma_config.json" % str(session.get("user")), 'w') as outfile:
                #    json.dump(createConfig("dev"), outfile)

                #cmd = "docker run --rm --name " + container + " --memory=" + plano["memory"] + "g --cpus="+plano["cpu"] + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                #    " ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local --privileged=true -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles axon/somma-core-dev"

                #os.system(cmd)

                plano = {
                    "name" : "dev",
                    "cpu" : "4",
                    "memory" : "4"
                }

                ''' DEV da forma anterior'''
                with open("/sfiles/somma_config.json", 'w') as outfile:
                    json.dump(createConfig("dev", container=container, machine = machine, machine_id="dev", app_id = runJSON["app_id"]), outfile)

                management.createExecution(
                    container, machine, user, email, runJSON["app"], plano, runJSON["schema"], runJSON["state"], dev=dev)

                # subprocess.check_output(['docker', 'run', '-d', '--name TEST', 'hello-world'])
                
                docker_client = docker.from_env()

                envsRunJson = {
                    "app": runJSON["app"].replace(" ", "+"),
                    "app_id": runJSON["app_id"].replace(" ", "+"),
                    "schema": runJSON["schema"].replace(" ", "+"),
                    "state": runJSON["state"].replace(" ", "+"),
                    "user": str(session.get("user")),
                    "place": "local -v /tmp/" + str(session.get("user")),
                }
                volumesRunJson = {
                    '/sfiles/': {'bind': '/sfiles/', 'mode': 'rw'},                    
                }
                docker_client.containers.run('somma-core-local', detach=True, hostname="somma-core", network="somma-studio_default", volumes=volumesRunJson, environment=envsRunJson)
       
                return "application requested to run"

            elif cloud in ["somma"]:# and "somma.free" in runJSON["plan"]:

                try:
                    if not management.verifyExecution(user, session.get("max_executions")):
                        return "Max Execution Limit"

                    docker_img = "somma-core:latest" if not dev else "somma-core-dev-cognito:0.00"

                    try:
                        remote = Remote(ip, cloud_user, key_path)
                    except Exception as e:
                        print(e)
                        return "Machine Booting"


                    user_path = "USER_PATH=" + str(session.get("user"))
                    config = createConfig(plano, container = container, machine = machine, app_id = runJSON["app_id"])

                    remote.sshCommands("mkdir -p /tmp/" + str(session.get("user")) +"/sfiles/cc -m 666")
                    remote.writeJSON(config, "/tmp/" + str(session.get("user")) + "/sfiles/somma_config.json")

                    cmd = "docker run --rm " + " --name " + container + " --memory=" + str(plano["memory"]) + "g --cpus="+str(plano["cpu"]) + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                        " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles:Z sa-saopaulo-1.ocir.io/grr1zbdsa9ua/"+docker_img# + management.get_somma_version(_id)

                    #management.createExecution(container, ip, user, email, runJSON["app"], plano, runJSON["schema"], runJSON["state"])
                    management.createExecution(container, ip, user, email, runJSON["app"], plano, runJSON["schema"], runJSON["state"], cloud_provider=cloud_provider)
                    print(remote.sshCommands(cmd, blocking = False))
                    remote.closeConnection()

                    return "application requested to run"



                except Exception as e:
                    management.finishExecution(user)
                    remote.closeConnection()
                    import traceback
                    traceback.print_exc()
                    print(e)


            elif cloud in ["axon", "mack", "skl", "phi01", "phi02"]:
                '''
                Não será mais usado, mas o código pode ser útil
                '''
                try:

                    if not management.verifyExecution(user, session.get("max_executions")):
                        return "Max Execution Limit"

                    docker_img = "somma-core" if not dev else "somma-core-" + dev_mode

                    somma_config = randomString()

                    with open("/tmp/" + somma_config, 'w') as outfile:
                        json.dump(createConfig(plano, container=container, machine=machine, app_id = runJSON["app_id"]), outfile)

                    management.createExecution(container, machine, user, email, runJSON["app"], plano, runJSON["schema"], runJSON["state"], dev=dev)

                    subprocess.call(["scp", "-P", "2222", "-i", "/tmp/axon", "-o",
                                    "StrictHostKeyChecking=no", "/tmp/" + somma_config, "lcon@lspd.mackenzie.br:/tmp/"])
                    subprocess.call(["ssh", "-p", "2222", "-i", "/tmp/axon", "-o", "StrictHostKeyChecking=no", "lcon@lspd.mackenzie.br", "-Att",
                                    "ssh -i /home/lcon/.ssh/" + machine, "axon@" + machine, "mkdir -p /tmp/" + str(session.get("user")) + "/sfiles /tmp/" + str(session.get("user")) + "/sfiles/cc "])
                    subprocess.call(["ssh", "-p", "2222", "-i", "/tmp/axon", "-o", "StrictHostKeyChecking=no", "lcon@lspd.mackenzie.br",
                                    "scp -i /home/lcon/.ssh/" + machine, "/tmp/" + somma_config, "axon@" + machine + ":/tmp/" + str(session.get("user")) + "/sfiles/somma_config.json"])
                    cmd = "docker run --rm --name " + container + " --memory=" + str(plano["memory"]) + "g --cpus="+str(plano["cpu"]) + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                        " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles axon/" + docker_img

                    subprocess.Popen(["ssh", "-p", "2222", "-i", "/tmp/axon", "-o", "StrictHostKeyChecking=no",
                                    "lcon@lspd.mackenzie.br", "-Att", "ssh -i /home/lcon/.ssh/" + machine, "axon@" + machine, cmd])

                    return "application requested to run"
                except:
                    management.finishExecution(user)
                    management.freeResource(machine, plano["cpu"], plano["memory"])
                    return "Unexpected Error"

                #management.updateStatusByName(runJSON["app"], user, "finished", True)

            elif cloud in ["oracle", "aws"]:
                try:

                    #ip = management.get_default_machine_ip(user, runJSON["plan"])
                    _id = runJSON["instance_id"]
                    ip = management.get_machine_ip(_id, session.get("emp_user"), user)

                    if ip == "no machine":
                        return "No Machine"
                    elif ip == "Machine Occupied":
                        return ip

                    if not ip:
                        return "Machine Booting"

                    gpu = management.get_gpu_flag(runJSON["plan"])

                    try:
                        if cloud == "oracle":
                            cloud_user = "ubuntu" if gpu else "opc"
                            remote = Remote(ip, cloud_user, key_path="/tmp/oracle.key")
                        if cloud == "aws":
                            cloud_user = "ec2-user" if gpu else "centos"
                            remote = Remote(ip, cloud_user, key_path="/tmp/centos_ec2.pem")
                    except Exception as e:
                        print(e)
                        return "Machine Booting"

                    #if not gpu and not "CONTAINER ID" in remote.sshCommands("docker ps -a", blocking = True):
                    #    return "Machine Booting"

                    management.update_machine_status(_id, "occupied")

                    user_path = "USER_PATH=" + str(session.get("user"))
                    config = createConfig(plano, container = container, machine_id = _id, app_id = runJSON["app_id"])

                    '''
                    Exemplo utilizando s3 pra salvar o somma_config
                    '''


                    #Substituir pelo S3
                    remote.sshCommands("mkdir -p /tmp/" + str(session.get("user")) +"/sfiles/cc -m 666")
                    remote.writeJSON(config, "/tmp/" + str(session.get("user")) + "/sfiles/somma_config.json")
                    #--------------------------------

                    homePath = "/home/centos/" if cloud == "aws" else ""

                    print(remote.writeFile(user_path, homePath + "/data_api/.env"))
                    params = "--gpus=all" if gpu else ""

                    if cloud == "oracle":
                        if "GPU" not in runJSON["plan"]:
                            params = ""
                        cmd = "docker run --rm "+ params +" --name " + container + " --memory=" + str(plano["memory"]) + "g --cpus="+str(plano["cpu"]) + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                            " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles:Z sa-saopaulo-1.ocir.io/grr1zbdsa9ua/somma-core:" + management.get_somma_version(_id)
                        # if runJSON["state"] == "streaming" and runJSON["hasWebApi"] == True:
                        #     cmd = "docker run --rm -d --network=data_api_app-tier "+ params +" --name " + container + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                        #         " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles:Z sa-saopaulo-1.ocir.io/grr1zbdsa9ua/somma-core:" + management.get_somma_version(_id)

                        #     cmd_api = "cd data_api/ && docker-compose up -d"
                    elif cloud == "aws":
                        if runJSON["state"] == "streaming" and runJSON["hasWebApi"] == True:
                            cmd = "docker run --rm -d --network=data_api_app-tier "+ params +" --name " + container + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                                " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles:Z sa-saopaulo-1.ocir.io/grr1zbdsa9ua/somma-core:" + management.get_somma_version(_id)

                            cmd_api = "cd data_api/ && docker-compose up -d"
                        else:
                            #"docker run --rm --network=data_api_app-tier " + ..
                            cmd = "docker run --rm "+ params +" --name " + container + " -e app=\'" + runJSON["app"].replace(" ", "+") + "\' -e schema=\'" + runJSON["schema"].replace(
                                " ", "+") + "\' -e app_id=\'" + runJSON["app_id"].replace(" ", "+") + "\' -e state=\'" + runJSON["state"].replace(" ", "+") + "\' -e user=\'" + str(session.get("user")) + "\' -e place=local -v /tmp/" + str(session.get("user")) + "/sfiles:/sfiles:Z sa-saopaulo-1.ocir.io/grr1zbdsa9ua/somma-core:" + management.get_somma_version(_id)


                    management.createExecution(container, ip, user, email, runJSON["app"], plano, runJSON["schema"], runJSON["state"], machine_id = ObjectId(_id))

                    #print(remote.sshCommands("docker kill $(docker ps -q)", blocking = True))

                    if runJSON["state"] == "streaming" and runJSON["hasWebApi"] == True:
                        #print(remote.sshCommands(cmd_api + " && " + cmd, blocking = True))
                        print(remote.sshCommands(cmd, blocking = False))
                    else:
                        print(remote.sshCommands(cmd, blocking = False))
                    remote.closeConnection()
                    return "application requested to run"
                except Exception as e:
                    import traceback
                    remote.closeConnection()
                    traceback.print_exc()
                    print(e)

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
