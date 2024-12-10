from project import app
from flask import request, render_template, jsonify, session
from project.models.management import Management
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
from pprint import pprint
import pandas as pd
import json

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

@app.route('/create-machine', methods=['POST'])
def create_machine():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'POST':
                data = request.values.to_dict()
                management = Management()
                plan = management.get_plan(data["plan"])

                if not plan:
                    return "plan not valid"

                emp_user = session.get("emp_user")

                if "gpu" in data["plan"].lower() and "oracle" in data["plan"].lower() and not management.authorize_gpu(emp_user):
                    return "plan not valid"

                if (type(data["shared_machine"])) == str:
                    if(data["shared_machine"] == 'false'):
                        data["shared_machine"] = False
                    else:
                        data["shared_machine"] = True
                        
                if not data["shared_machine"]:
                    user = management.verify_user_company(data["user"], emp_user)
                    if not user:
                        return "user not valid"
                    user = user["user"]
                else:
                    user = ""
               
                _id = management.create_machine(user, plan["name"], emp_user = emp_user, shared_machine = data["shared_machine"], name = data["name"], created_by = session.get("user"))

                return jsonify(management.get_machine_by_id(_id, emp_user))
        
        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/terminate-instance', methods=['POST'])
def terminate_instance():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'POST':

                data = json.loads(list(request.values.to_dict())[0])

                management = Management()

                emp_user = session.get("emp_user")

                return jsonify([management.terminate_instance_by_id(_id, emp_user) for _id in data["ids"]])

        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/force-terminate-instance', methods=['POST'])
def force_terminate_instance():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'POST':

                data = json.loads(list(request.values.to_dict())[0])

                management = Management()

                emp_user = session.get("emp_user")

                output = []

                for _id in data["ids"]:

                    print(_id)

                    if management.verify_machine_adm_permission(_id, emp_user):
                        management.updateStatusById(_id, "stopped")
                        output.append(management.force_terminate_instance_by_id(_id, emp_user))
                    else:
                        output.append("no permission")

                return jsonify(output)

        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/get_emp_users', methods=['GET'])
def get_emp_users():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'GET':

                management = Management()

                emp_user = session.get("emp_user")               
               
                return jsonify(management.get_all_users(emp_user))

        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/get-all-plans', methods=['GET'])
def get_all_plans():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'GET':

                management = Management()
               
                df = pd.DataFrame(management.get_all_plans(session.get("emp_user")) )

                plans = df.groupby('cloud_provider')['instance'].apply(list).to_dict()

                info = {plan["instance"] : plan for plan in df[["cpu", "memory", "bandwidth", "instance"]].to_dict(orient = "records")}
                
                if not management.is_axon_user(session.get("user")):
                    plans["oracle"] = []
                    info = {k: v for k, v in info.items() if 'VM.' not in k and "BM." not in k}

                return jsonify({"plans" : plans, "info" : info})
                        
        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/get-emp-machines', methods=['GET'])
def get_emp_machines():
    
    if session.get('logged_in'):

        if session.get("admin"):

            if request.method == 'GET':

                data = request.values.to_dict()

                emp_user = session.get("emp_user")
                
                management = Management()
                               
                if "update_ips" in data and data["update_ips"]:
                    management.update_machine_ips(emp_user)

                machines = management.get_all_emp_machines(emp_user)

                return jsonify(machines)
        
        else:
            return "Not authorized"

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

@app.route('/get-user-machines', methods=['GET'])
def get_user_machines():
    
    if session.get('logged_in'):

        if request.method == 'GET':

            management = Management()

            emp_user = session.get("emp_user")
            user = session.get("user")           
            
            machines = management.get_all_user_machines(user, emp_user)


            return jsonify(machines)

    else:
        return render_template("login/login.html", data={"version": app.config["SOMMA_VERSION"]})

