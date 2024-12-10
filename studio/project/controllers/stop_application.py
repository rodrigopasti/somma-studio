from project import app
from flask import request, render_template, session, jsonify
import json
import os
import subprocess
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
from project.models.management import Management
import re
import time
from project.controllers.remote import Remote

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()


@app.route('/get-application-status', methods=['GET'])
def application_status():

    if session.get('logged_in'):

        if request.method == 'GET':

            management = Management()
            container = str(session.get("user")) + str(request.args.get("app_id", ""))
            request_number = int(request.args.get("request_number", ""))
            status = management.getStatus(container)
            running = status == "running"

            if running:
                return "Application Started"
            elif request_number >= 15:
                status = management.getStatus(container)
                if status == "requested":
                    updated = management.updateStatus(container, "timeout")
                    if updated:
                        machine = management.getMachine(container)
                        gpu = management.get_gpu_flag(machine["plan"])
                        if machine["cloud"] == "somma":
                            if machine["cloud_provider"] == "oracle":
                                cloud_user = "opc"
                                remote = Remote(machine["ip"], cloud_user, key_path="/tmp/oracle.key")
                            elif machine["cloud_provider"] == "digitalocean":
                                cloud_user = "root"
                                remote = Remote(machine["ip"], cloud_user, key_path="/tmp/digital_ocean")
                            elif machine["cloud_provider"] == "aws":
                                cloud_user = "centos"
                                remote = Remote(machine["ip"], cloud_user, key_path="/tmp/centos_ec2.pem")
                            remote.sshCommands(cmd)
                            management.finishExecution(str(session.get("user")))
                        elif machine["cloud"] == "oracle":
                            cloud_user = "ubuntu" if gpu else "opc"
                            remote = Remote(machine["ip"], cloud_user, key_path="/tmp/oracle.key")
                            remote.sshCommands(cmd)
                        elif machine["cloud"] == "aws":
                            cloud_user = "ec2-user" if gpu else "centos"
                            remote = Remote(machine["ip"], cloud_user, key_path="/tmp/centos_ec2.pem")
                            remote.sshCommands(cmd_api)


                    return "Application Timed Out"
            else:
                return "Application Not Started"




            '''running = False
            i = 0

            while not running:
                running = management.getStatus(container) == "running"
                time.sleep(1)
                if i > 30:
                    if management.getStatus(container) == "requested":
                        updated = management.updateStatus(container, "timeout")
                        if updated:
                            management.finishExecution(str(session.get("user")))
                            machine = management.getMachine(container)
                            management.freeResourceWithContainer(machine, container)
                    return "Application Timed Out"
                i += 1
            '''

            '''machine = ""

            while (machine == ""):
                time.sleep(1)
                machine = management.getMachine(container)
                #print(machine)

            out = ""

            i = 0

            while (len(re.findall(r'Up \d+ seconds', out)) == 0):
                if "Exited (1)" in out:
                    updated = management.updateStatus(container, "error")
                    if updated:
                        management.finishExecution(str(session.get("user")))
                        management.freeResourceWithContainer(machine, container)
                    return "Application Exited with Error"
                elif "Exited (137)" in out:
                    updated = management.updateStatus(container, "stopped")
                    if updated:
                        management.finishExecution(str(session.get("user")))
                        management.freeResourceWithContainer(machine, container)
                    return "Application Stopped By User"

                time.sleep(2)
                out = subprocess.check_output(["ssh", "-p", "2222", "-i", "/tmp/axon", "-o", "StrictHostKeyChecking=no",
                                               "lcon@lspd.mackenzie.br", "-Att", "ssh", "axon@" + machine, "docker ps -af name=%s" % container]).decode('utf-8')
                i += 1

                if i > 30:
                    updated = management.updateStatus(container, "timeout")
                    if updated:
                        management.finishExecution(str(session.get("user")))
                        management.freeResourceWithContainer(machine, container)
                    return "Application Timed Out"
            '''


            return "Application Started"
    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})



@app.route('/stop-application', methods=['POST'])
def stop_application():
    '''
    Esta rota é responsável pelo controle de PARAR a execução da aplicação
    '''

    if session.get('logged_in'):

        if request.method == 'POST':

            '''
            Recebendo valor através do POST (JSON de info da aplicação)
            '''
            data = str(request.values)
            data = data.replace("CombinedMultiDict([ImmutableMultiDict([('", "")
            data = data.replace("', '')]), ImmutableMultiDict([])])", "")
            runJSON = json.loads(data)

            '''
            Acionando backend
            '''

            management = Management()
            container = management.getLastExecutionContainer(str(session.get("user")), runJSON["app"], runJSON["schema"])

            if container != "":
                status = management.getStatus(container)
                if status == "running":
                    machine = management.getMachine(container)
                    cmd = "docker stop " + container
                    cmd_api = "docker stop " + container + " && " + "cd data_api/ && docker-compose down"
                    gpu = management.get_gpu_flag(machine["plan"])
                    if machine["ip"] in ["skl", "phi02", "phi01"]:
                        subprocess.call(["ssh", "-p", "2222", "-i", "/tmp/axon", "-o", "StrictHostKeyChecking=no", "lcon@lspd.mackenzie.br", "-Att", "ssh", "axon@" + machine["ip"], cmd])

                    elif machine["cloud"] == "somma":
                        if machine["cloud_provider"] == "oracle":
                            cloud_user = "opc"
                            remote = Remote(machine["ip"], cloud_user, key_path="/tmp/oracle.key")
                        elif machine["cloud_provider"] == "digitalocean":
                            cloud_user = "root"
                            remote = Remote(machine["ip"], cloud_user, key_path="/tmp/digital_ocean")
                        elif machine["cloud_provider"] == "aws":
                            cloud_user = "centos"
                            remote = Remote(machine["ip"], cloud_user, key_path="/tmp/centos_ec2.pem")
                        remote.sshCommands(cmd)
                        management.finishExecution(str(session.get("user")))

                    elif machine["cloud"] == "oracle":
                        cloud_user = "ubuntu" if gpu else "opc"
                        remote = Remote(machine["ip"], cloud_user, key_path="/tmp/oracle.key")
                        remote.sshCommands(cmd)
                    elif machine["cloud"] == "aws":
                        cloud_user = "ec2-user" if gpu else "centos"
                        remote = Remote(machine["ip"], cloud_user, key_path="/tmp/centos_ec2.pem")
                        remote.sshCommands(cmd_api)

                    management.updateStatus(container, "stopped")
                    management.update_machine_status_by_ip(machine["ip"], "running")

                    if machine["ip"] in ["skl", "phi01", "phi02"]:
                        management.freeResourceWithContainer(machine["ip"], container)
                    msg = "application stopped"
                elif status == "stopped":
                    msg = "Application stopped by other request"
                elif status == "error":
                    msg = "Application exited with error"
                elif status == "timeout":
                    msg = "Application timed-out"
                elif status == "finished":
                    msg = "Application finished before stop requisition"

                return jsonify({"msg": msg , "schema": runJSON["schema"]})

            else:
                return jsonify({"msg": "application not stopped"})

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
