import pymongo
from pymongo import MongoClient
from project import app
from datetime import datetime
import math
import os
import hashlib
from atlasapi.atlas import Atlas
from atlasapi.specs import DatabaseUsersPermissionsSpecs, RoleSpecs, DatabaseUsersUpdatePermissionsSpecs
from project.controllers.oracle import OCI
from project.controllers.aws import EC2
from bson.objectid import ObjectId
from project.controllers.remote import Remote

def ceil_dt(dt, deltat):
    nsecs = dt.minute*60 + dt.second + dt.microsecond*1e-6
    delta = math.ceil(nsecs / (deltat*60)) * (deltat*60) - nsecs
    return dt + datetime.timedelta(seconds=delta)


class Management(object):

    def __init__(self):
        try:
            adm = os.environ["SOMMA_ADM"]
            pwd = os.environ["SOMMA_PWD"]
            self.adm_db = os.environ["ADM_DATABASE"]
            
            if app.config["RUN_MODE"] == "DEV":
                uri = app.config["MONGO_URI"] + app.config["ADM_DATABASE"]
            else:
                uri = "mongodb+srv://%s:%s@%s/%s" % (
                    adm, pwd, app.config["MONGO_SOMMA"], app.config["ADM_DATABASE"])
                    
            self._mongo = MongoClient(uri)

        except Exception as e:
            print(e)
            pass

    def authorize_gpu(self, emp_user):
        return emp_user in ["3f4800ea5ff3fa1d1630bb89fd92ac26b810b10bf76d872fcf344e22"]

    def create_machine(self, user, plan, image_id = "", version = "latest", emp_user = "", shared_machine = False, name = "", created_by = ""):

        cloud = plan.split(".")[0]
        instance = plan.split(".", 1)[1]

        gpu = self.get_gpu_flag(plan)

        if not image_id:
            image = self.get_cloud_image(cloud, version = version, gpu = gpu)
            image_id = image["image_id"]


        if cloud == "oracle":
            if gpu and self.authorize_gpu(emp_user):
                oracle = OCI(profile= "SOMMA_GPU")
                machine = oracle.create_gpu_instance(emp_user, "somma-core", "", machine = instance, image_id = image_id, emp_user = emp_user)
            else:
                oracle = OCI()
                machine = oracle.create_instance(emp_user, "somma-core", "", machine = instance, image_id = image_id, emp_user = emp_user)
        elif cloud == "aws":
            ec2 = EC2()
            machine = ec2.create_instance(image_id, instance, emp_user = emp_user)

        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].insert_one({"user" : user,
                                                                                "emp_user" : emp_user,
                                                                                "shared_machine" : shared_machine,
                                                                                "plan" : plan,
                                                                                "name" : name,
                                                                                "instance_type" : instance,
                                                                                "machine_id" : machine["id"],
                                                                                "compartment_id" : machine["compartment_id"],
                                                                                "status" : "provisioning",
                                                                                "start_time" : datetime.utcnow(),
                                                                                "cloud_provider" : cloud,
                                                                                "runtime" : image["runtime"],
                                                                                "runtime_id" : image["runtime_id"],
                                                                                "created_by" : created_by})
        return str(machine.inserted_id)

    def get_runtime(self, machine_id):
        return self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"_id" : ObjectId(machine_id)})["runtime_id"]


    def get_somma_version(self, machine_id):
        return self._mongo[app.config["ADM_DATABASE"]]["images"].find_one({"_id" : self.get_runtime(machine_id)})["version"]

    def get_gpu_flag(self, plan):
        return self._mongo[app.config["ADM_DATABASE"]]["planos"].find_one({"name" : plan})["gpu"]


    def get_cloud_image(self, cloud, gpu=False, version = "latest"):
        if version != "latest":
            image = self._mongo[app.config["ADM_DATABASE"]]["images"].find_one({"cloud_provider" : cloud,
                                                                                "status" : "available",
                                                                                "version" : version + "-gpu" if gpu else "",
                                                                                "gpu" : gpu})
        else:
            image = self._mongo[app.config["ADM_DATABASE"]]["images"].find_one({"cloud_provider": cloud,
                                                                                "status": "available",
                                                                                "gpu" : gpu},
                                                                               sort=[('_id', pymongo.DESCENDING)]
                                                                              )

        print(image)
        return {"runtime" : image["display_name"], "runtime_id" : image["_id"], "image_id" : image["image_id"]}


    def terminate_default_instance(self, user, plan):

        cloud = plan.split(".")[0]

        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"user": user,
                                                                                "plan": plan,
                                                                                "name" : "default_machine",
                                                                                "status": {"$in":
                                                                                           ["running",
                                                                                            "provisioning"]}}
                                                                               )

        if cloud == "oracle":
            oracle = OCI()
            oracle.terminate_instance(machine["machine_id"])
        elif cloud == "aws":
            ec2 = EC2()
            ec2.terminate_instance(machine["machine_id"])

        self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "end_time": datetime.utcnow(),
                                                                                "status" : "stopped"
                                                                            }})

    def terminate_instance_by_id(self, _id, emp_user):


        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"_id": ObjectId(_id),
                                                                                "emp_user": emp_user,
                                                                                "status": {"$in":
                                                                                           ["running",
                                                                                            "provisioning"]}}
                                                                               )

        if not machine:
            return "machine not found"

        cloud = machine["cloud_provider"]

        if cloud == "oracle":
            if self.get_gpu_flag(machine["plan"]):
                oracle = OCI(profile="SOMMA_GPU")
            else:
                oracle = OCI()
            oracle.terminate_instance(machine["machine_id"])
        elif cloud == "aws":
            ec2 = EC2()
            ec2.terminate_instance(machine["machine_id"])

        self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "end_time": datetime.utcnow(),
                                                                                "status" : "stopped"
                                                                            }})

        return "machine terminated"

    def force_terminate_instance_by_id(self, _id, emp_user):


        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"_id": ObjectId(_id),
                                                                                "emp_user": emp_user,
                                                                                "status": "occupied"}
                                                                               )

        if not machine:
            return "machine not found"

        cloud = machine["cloud_provider"]

        if cloud == "oracle":
            if self.get_gpu_flag(machine["plan"]):
                oracle = OCI(profile="SOMMA_GPU")
            else:
                oracle = OCI()
            oracle.terminate_instance(machine["machine_id"])
        elif cloud == "aws":
            ec2 = EC2()
            ec2.terminate_instance(machine["machine_id"])

        self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "end_time": datetime.utcnow(),
                                                                                "status" : "stopped"
                                                                            }})

        return "machine terminated"

    def get_default_machine_ip(self, user, plan):

        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"user" : user,
                                                                                "plan" : plan,
                                                                                "status" : {"$in" : ["provisioning",
                                                                                                    "running"
                                                                                                    ]
                                                                                            }})

        if not machine:
            return "no machine"

        if machine["status"] == "running":
            return machine["ip"]
        else:
            if machine["cloud_provider"] == "oracle":
                if self.get_gpu_flag(plan):
                    oracle = OCI(profile="SOMMA_GPU")
                else:
                    oracle = OCI()

                ip = oracle.get_machine_ip(machine["machine_id"], machine["compartment_id"])
            elif machine["cloud_provider"] == "aws":
                ec2 = EC2()
                ip = ec2.get_machine_ip(machine["machine_id"])

            if ip:
                self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "status" : "running",
                                                                                "ip" : ip
                                                                                }
                                                                            })
            return ip

    def update_machine_status(self, _id, status):

        self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : ObjectId(_id)},
                                                                       {"$set" : {"status" : status}})

    def update_machine_status_by_ip(self, ip, status):

        if status == "running":

            self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"ip" : ip, "status" : "occupied"},
                                                                           {"$set" : {"status" : status}})

    def verify_machine_user_permission(self, _id, emp_user, user):
        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"$or" : [
                                                                                    {"emp_user": emp_user, "shared_machine" : True},
                                                                                    {"user" : user}
                                                                                ],
                                                                                "_id" : ObjectId(_id)
                                                                                })

        if machine:
            return True
        else:
            return False

    def verify_machine_adm_permission(self, _id, emp_user):
        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"emp_user": emp_user,
                                                                                "_id" : ObjectId(_id)
                                                                                })

        if machine:
            return True
        else:
            return False

    def get_machine_ip(self, _id, emp_user, user):

        machine = self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"$or" : [
                                                                                    {"emp_user": emp_user, "shared_machine" : True},
                                                                                    {"user" : user}
                                                                                ],
                                                                                "_id" : ObjectId(_id),
                                                                                "status" : {"$in" : ["provisioning",
                                                                                                     "running",
                                                                                                     "occupied"
                                                                                                    ]
                                                                                            }})

        if not machine:
            return "no machine"

        if machine["status"] == "running":
            return machine["ip"]
        elif machine["status"] == "occupied":
            return "Machine Occupied"
        else:
            if machine["cloud_provider"] == "oracle":
                if self.get_gpu_flag(machine["plan"]):
                    oracle = OCI(profile="SOMMA_GPU")
                else:
                    oracle = OCI()
                ip = oracle.get_machine_ip(machine["machine_id"], machine["compartment_id"])
            elif machine["cloud_provider"] == "aws":
                ec2 = EC2()
                ip = ec2.get_machine_ip(machine["machine_id"])

            if ip:
                self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "status" : "running",
                                                                                "ip" : ip
                                                                                }
                                                                            })
            return ip

    def update_machine_ips(self, emp_user):

        machines = self._mongo[app.config["ADM_DATABASE"]]["machines"].find({"emp_user" : emp_user,
                                                                            "status" : {"$in" : ["provisioning"]
                                                                                        }})

        for machine in machines:
            if machine["cloud_provider"] == "oracle":
                if self.get_gpu_flag(machine["plan"]):
                    oracle = OCI(profile="SOMMA_GPU")
                else:
                    oracle = OCI()
                ip = oracle.get_machine_ip(machine["machine_id"], machine["compartment_id"])
            elif machine["cloud_provider"] == "aws":
                ec2 = EC2()
                ip = ec2.get_machine_ip(machine["machine_id"])

            if ip:
                self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "status" : "running",
                                                                                "ip" : ip
                                                                                }
                                                                            })

    def update_user_machine_ips(self, user, emp_user):

        machines = self._mongo[app.config["ADM_DATABASE"]]["machines"].find({"$or" : [
                                                                                    {"emp_user": emp_user, "shared_machine" : True},
                                                                                    {"user" : user}
                                                                                ],

                                                                            "status" : {"$in" : ["provisioning"]
                                                                                        }})

        for machine in machines:
            if machine["cloud_provider"] == "oracle":
                if self.get_gpu_flag(machine["plan"]):
                    oracle = OCI(profile="SOMMA_GPU")
                else:
                    oracle = OCI()
                ip = oracle.get_machine_ip(machine["machine_id"], machine["compartment_id"])
            elif machine["cloud_provider"] == "aws":
                ec2 = EC2()
                ip = ec2.get_machine_ip(machine["machine_id"])

            if ip:
                self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id" : machine["_id"]},
                                                                            {"$set" : {
                                                                                "status" : "running",
                                                                                "ip" : ip
                                                                                }
                                                                            })

    def verify_running_machine(self, user, plan):

        if self._mongo[app.config["ADM_DATABASE"]]["machines"].find_one({"user": user,
                                                                      "plan": plan,
                                                                      "status": {"$in": ["provisioning",
                                                                                         "running"
                                                                                         ]
                                                                                 }}):
            return True
        else:
            return False

    def get_machine_by_id(self, _id, emp_user):
        return list(self._mongo[app.config["ADM_DATABASE"]]["machines"].aggregate([
                        {"$match" :
                            {"emp_user": emp_user,
                             "_id" : ObjectId(_id),
                            "status": {"$in": ["provisioning",
                                                "running",
                                                "occupied"
                                                ]
                                        }}
                        },
                        {"$lookup" : {
                            "from" : "users",
                            "localField" : "user",
                            "foreignField" : "user",
                            "as" : "info_user"
                        }},

                        {"$lookup" : {
                            "from" : "users",
                            "localField" : "created_by",
                            "foreignField" : "user",
                            "as" : "created_by"
                        }},

                        {"$lookup" : {
                            "from" : "planos",
                            "localField" : "plan",
                            "foreignField" : "name",
                            "as" : "plan"
                        }},

                        {"$unwind" : "$plan"},
                        {"$unwind" : "$created_by"},
                        {"$unwind" : {"path" : "$info_user", "preserveNullAndEmptyArrays" : True}},

                        {"$project" : {
                            "id" : {"$toString" : "$_id"},
                            "user" : "$info_user.email",
                            "created_by" : "$created_by.email",
                            "cpu" : "$plan.cpu",
                            "memory" : "$plan.memory",
                            "name" : 1,
                            "status" : 1,
                            "instance_type" : 1,
                            "cloud_provider" : 1,
                            "shared_machine" : 1,
                            "start_time" : 1,
                            "runtime" : 1,
                            "ip" : 1,
                            "_id" : 0
                        }},



                    ]))


    def get_all_emp_machines(self, emp_user):
        return list(self._mongo[app.config["ADM_DATABASE"]]["machines"].aggregate([
                    {"$match" :
                        {"emp_user": emp_user,
                        "status": {"$in": ["provisioning",
                                            "running",
                                            "occupied"
                                            ]
                                    }}
                    },
                    {"$lookup" : {
                        "from" : "users",
                        "localField" : "user",
                        "foreignField" : "user",
                        "as" : "info_user"
                    }},

                    {"$lookup" : {
                        "from" : "users",
                        "localField" : "created_by",
                        "foreignField" : "user",
                        "as" : "created_by"
                    }},

                    {"$lookup" : {
                        "from" : "planos",
                        "localField" : "plan",
                        "foreignField" : "name",
                        "as" : "plan"
                    }},

                    {"$unwind" : "$plan"},
                    {"$unwind" : "$created_by"},
                    {"$unwind" : {"path" : "$info_user", "preserveNullAndEmptyArrays" : True}},

                    {"$project" : {
                        "id" : {"$toString" : "$_id"},
                        "user" : "$info_user.email",
                        "created_by" : "$created_by.email",
                        "cpu" : "$plan.cpu",
                        "memory" : "$plan.memory",
                        "name" : 1,
                        "status" : 1,
                        "instance_type" : 1,
                        "cloud_provider" : 1,
                        "shared_machine" : 1,
                        "start_time" : 1,
                        "runtime" : 1,
                        "ip" : 1,
                        "_id" : 0
                    }},



                ]))

    def get_all_user_machines(self, user, emp_user):

        self.update_user_machine_ips(user, emp_user)

        return list(self._mongo[app.config["ADM_DATABASE"]]["machines"].aggregate([
                    {"$match" :
                        {
                            "$or" : [
                                {"emp_user": emp_user, "shared_machine" : True},
                                {"user" : user}
                            ],

                            "status": {"$in": ["provisioning",
                                            "running",
                                            "occupied"
                                            ]
                                    }

                        }
                    },
                    {"$lookup" : {
                        "from" : "users",
                        "localField" : "user",
                        "foreignField" : "user",
                        "as" : "info_user"
                    }},

                    {"$lookup" : {
                        "from" : "users",
                        "localField" : "created_by",
                        "foreignField" : "user",
                        "as" : "created_by"
                    }},

                    {"$lookup" : {
                        "from" : "planos",
                        "localField" : "plan",
                        "foreignField" : "name",
                        "as" : "plan"
                    }},

                    {"$unwind" : "$plan"},
                    {"$unwind" : "$created_by"},
                    {"$unwind" : {"path" : "$info_user", "preserveNullAndEmptyArrays" : True}},

                    {"$project" : {
                        "id" : {"$toString" : "$_id"},
                        "user" : "$info_user.email",
                        "created_by" : "$created_by.email",
                        "cpu" : "$plan.cpu",
                        "memory" : "$plan.memory",
                        "name" : 1,
                        "status" : 1,
                        "instance_type" : 1,
                        "cloud_provider" : 1,
                        "shared_machine" : 1,
                        "start_time" : 1,
                        "runtime" : 1,
                        "ip" : 1,
                        "_id" : 0
                    }},



                ]))

    def get_used_servers(self, emp_user):
        used_servers = list(self._mongo[app.config["ADM_DATABASE"]]["billing"].find({"user": emp_user},{"_id":0},sort=[('end', pymongo.ASCENDING)]))
        for used_server in used_servers:
            if used_server["cost"] > 0:
                used_server["cost"] = format(used_server["cost"], '.10f')

        return used_servers

    def get_plan(self, plan):
        return self._mongo[app.config["ADM_DATABASE"]]["planos"].find_one({"instance" : plan})

    def get_all_plans(self, emp_user):
        planos = list(self._mongo[app.config["ADM_DATABASE"]]["planos"].find({"cloud_provider" : {"$nin" : ["axon", "mack", "skl", "phi01", "phi02"]}}))
        return [plano for plano in planos if "gpu" in plano and not plano["gpu"] or ("gpu" in plano and plano["gpu"] and self.authorize_gpu(emp_user))]

    def get_all_users(self, emp_user):
        id_emp = self._mongo[app.config["ADM_DATABASE"]]["empresas"].find_one({"emp_user" : emp_user})["_id"]
        return [user["email"] for user in self._mongo[app.config["ADM_DATABASE"]]["users"].find({"id_empresa" : id_emp})]

    def verify_user_company(self, user, emp_user):
        id_emp = self._mongo[app.config["ADM_DATABASE"]]["empresas"].find_one({"emp_user" : emp_user})["_id"]
        return self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"id_empresa" : id_emp, "email" : user})

    def verify_workspace_update(self, user):
        try:
            return self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})["update_workspace"]
        except:
            return None

    def update_workspace(self, user, pwd, emp_user):

        atlas = Atlas(os.environ["ATLAS_PUBLIC"], os.environ["ATLAS_PRIVATE"], os.environ["ATLAS_GROUP"])

        p = DatabaseUsersUpdatePermissionsSpecs(pwd)

        LOGS_DATABASE = hashlib.sha1("logs".encode('utf-8')).hexdigest()[:7]
        DEFINITIONS_DATABASE = hashlib.sha1("definitions".encode('utf-8')).hexdigest()[:7]
        DATASETS_DATABASE = hashlib.sha1("datasets".encode('utf-8')).hexdigest()[:7]

        p.add_roles(user + LOGS_DATABASE,
                        [RoleSpecs.dbAdmin,
                        RoleSpecs.readWrite])

        p.add_roles(user + DEFINITIONS_DATABASE,
                    [RoleSpecs.dbAdmin,
                    RoleSpecs.readWrite])

        p.add_roles(user + DATASETS_DATABASE,
                    [RoleSpecs.dbAdmin,
                    RoleSpecs.readWrite])

        workspace = emp_user
        p.add_roles(workspace + DEFINITIONS_DATABASE,
                                [RoleSpecs.readWrite])

        atlas.DatabaseUsers.update_a_database_user(user, p)

        self._mongo[app.config["ADM_DATABASE"]]["users"].update_one({"user" : user}, {"$set" : {"update_workspace" : False}})

        return True

    def verify_credential_update(self, user):
        try:
            return self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})["update_credentials"]
        except:
            return None

    def update_credential(self, user, pwd, emp_user):

        atlas = Atlas(os.environ["ATLAS_PUBLIC"], os.environ["ATLAS_PRIVATE"], os.environ["ATLAS_GROUP"])

        p = DatabaseUsersUpdatePermissionsSpecs(pwd)

        LOGS_DATABASE = hashlib.sha1("logs".encode('utf-8')).hexdigest()[:7]
        DEFINITIONS_DATABASE = hashlib.sha1("definitions".encode('utf-8')).hexdigest()[:7]
        DATASETS_DATABASE = hashlib.sha1("datasets".encode('utf-8')).hexdigest()[:7]
        CREDENTIALS_DATABASE = hashlib.sha1("credentials".encode('utf-8')).hexdigest()[:7]

        p.add_roles(user + LOGS_DATABASE,
                        [RoleSpecs.dbAdmin,
                        RoleSpecs.readWrite])

        p.add_roles(user + DEFINITIONS_DATABASE,
                    [RoleSpecs.dbAdmin,
                    RoleSpecs.readWrite])

        p.add_roles(user + DATASETS_DATABASE,
                    [RoleSpecs.dbAdmin,
                    RoleSpecs.readWrite])

        workspace = emp_user
        p.add_roles(workspace + DEFINITIONS_DATABASE, [RoleSpecs.readWrite])

        p.add_roles(workspace + CREDENTIALS_DATABASE, [RoleSpecs.readWrite])

        atlas.DatabaseUsers.update_a_database_user(user, p)

        self._mongo[app.config["ADM_DATABASE"]]["users"].update_one({"user" : user}, {"$set" : {"update_credentials" : False}})

        return True



    def create_user(self, invite, user, pwd, email):

        try:
            LOGS_DATABASE = hashlib.sha1(
                "logs".encode('utf-8')).hexdigest()[:7]
            DEFINITIONS_DATABASE = hashlib.sha1(
                "definitions".encode('utf-8')).hexdigest()[:7]
            DATASETS_DATABASE = hashlib.sha1(
                "datasets".encode('utf-8')).hexdigest()[:7]
            CREDENTIALS_DATABASE = hashlib.sha1(
                "credentials".encode('utf-8')).hexdigest()[:7]

            adm = os.environ["SOMMA_ADM"]
            adm_pwd = os.environ["SOMMA_PWD"]
            host = os.environ["SOMMA_HOST"]
            adm_db = os.environ["ADM_DATABASE"]

            MONGO_IP = "mongodb+srv://%s:%s@%s/%s" % (
                adm, adm_pwd, host, adm_db)
            mongo = MongoClient(MONGO_IP)

            atlas = Atlas(os.environ["ATLAS_PUBLIC"],
                          os.environ["ATLAS_PRIVATE"], os.environ["ATLAS_GROUP"])

            record = {"user": user, "email": email,
                      "id_empresa": invite["id_empresa"], "admin": False, "n_executions": 0}

            p = DatabaseUsersPermissionsSpecs(user, pwd)
            p.add_roles(user + LOGS_DATABASE,
                        [RoleSpecs.dbAdmin,
                         RoleSpecs.readWrite])

            p.add_roles(user + DEFINITIONS_DATABASE,
                        [RoleSpecs.dbAdmin,
                         RoleSpecs.readWrite])

            p.add_roles(user + DATASETS_DATABASE,
                        [RoleSpecs.dbAdmin,
                         RoleSpecs.readWrite])

            empresa = mongo[adm_db].empresas.find_one(
                {"_id": invite["id_empresa"]})

            p.add_roles(empresa["emp_user"] + DEFINITIONS_DATABASE, [RoleSpecs.readWrite])

            p.add_roles(empresa["emp_user"] + CREDENTIALS_DATABASE, [RoleSpecs.readWrite])

            details = atlas.DatabaseUsers.create_a_database_user(p)

            mongo[adm_db].users.insert_one(
                record)
            mongo[adm_db].empresas.update_one(
                {"_id": invite["id_empresa"]}, {"$inc": {"nb_users": 1}})
            mongo[adm_db].clusters.update_one(
                {"_id": empresa["ids_clusters"][-1]}, {"$inc": {"nb_users": 1}})
            mongo[adm_db].convites.update_one(
                {"_id": invite["_id"]}, {"$inc": {"utilizacoes": -1}})
            return True

        except Exception as e:
            print(e)
            return False

    def getResource(self, plan):

        with self._mongo.start_session() as session:
            with session.start_transaction():
                machines = list(self._mongo[app.config["ADM_DATABASE"]]["machines"].find({"name" : {"$in" : ["somma-free-1"]} }))
                for machine in machines:
                    if int(plan["cpu"]) + machine["used_cpu"] <= machine["cpu"] and int(plan["memory"]) + machine["used_memory"] <= machine["memory"]:
                        self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one({"_id": machine["_id"]},
                                                    {"$inc": {"used_memory": int(plan["memory"]), "used_cpu": int(plan["cpu"])}})
                        return machine["name"]
                return False

    def freeResource(self, machine, cpu, memory):
        '''
        Função desativada, pois só era empregada na SKL
        '''
        if machine not in [mach["name"] for mach in list(self._mongo[app.config["ADM_DATABASE"]]["machines"].find())]:
            return True

        with self._mongo.start_session() as session:
            with session.start_transaction():
                try:
                    self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one(
                        {"name": machine},
                        {"$inc": {"used_memory": -memory, "used_cpu": -cpu}})
                    return True
                except:
                    return False

    def freeResourceWithContainer(self, machine, container):
        '''
        Função desativada, pois só era empregada na SKL
        '''
        if machine not in [mach["name"] for mach in list(self._mongo[app.config["ADM_DATABASE"]]["machines"].find())]:
            return True

        execution = self._mongo[app.config["ADM_DATABASE"]
                                ]["executions"].find_one({"container": container})
        cpu = execution["n_cpu"]
        memory = execution["memory"]

        with self._mongo.start_session() as session:
            with session.start_transaction():
                try:
                    self._mongo[app.config["ADM_DATABASE"]]["machines"].update_one(
                        {"name": machine},
                        {"$inc": {"used_memory": -memory, "used_cpu": -cpu}})
                    return True
                except:
                    return False

    def verifyExecution(self, user, max_exec):

        with self._mongo.start_session() as session:
            with session.start_transaction():
                if self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user": user, "n_executions": {"$lte": max_exec - 1}}) != None:
                    self._mongo[app.config["ADM_DATABASE"]]["users"].update_one(
                        {"user": user}, {"$inc": {"n_executions": 1}})
                    return True
                else:
                    return False

    def finishExecution(self, user):
        '''
        Usada somente no plano free e anteriormente na SKL
        Diminui o nr de execuções do usuário (somente no caso de plano free)
        '''
        #if ip in ["skl", "phi01", "phi02"]:
        with self._mongo.start_session() as session:
            with session.start_transaction():
                self._mongo[self.adm_db]["users"].update_one({"user": user, "n_executions" : {"$gt" : 0}}, {"$inc": {"n_executions": -1}})


    def getUserInfo(self, user):
        user_info = list(self._mongo[app.config["ADM_DATABASE"]].users.aggregate([
            {
                "$match": {"user": user}
            },

            {
                "$lookup": {
                    "from": "empresas",
                    "localField": "id_empresa",
                    "foreignField": "_id",
                    "as": "empresa"
                }
            },

            {
                "$lookup": {
                    "from": "planos",
                    "localField": "empresa.ids_planos",
                    "foreignField": "_id",
                    "as": "planos"
                }

            },

            {
                "$lookup": {
                    "from": "planos",
                    "localField": "empresa.id_default_plan",
                    "foreignField": "_id",
                    "as": "default_plan"
                }
            },


            {
                "$lookup": {
                    "from": "clusters",
                    "localField": "empresa.ids_clusters",
                    "foreignField": "_id",
                    "as": "clusters"
                }

            }

        ]

        ))
        return user_info[0]

    def createExecution(self, container, ip, user, email, appName, plano, schema, state, dev=False, machine_id = "", cloud_provider=""):
        self._mongo[app.config["ADM_DATABASE"]]["executions"].insert_one({"email": email,
                                                                          "user": user,
                                                                          "container": container,
                                                                          "status": "requested",
                                                                          "app": appName,
                                                                          "requested_time": datetime.utcnow(),
                                                                          "n_cpu": plano["cpu"],
                                                                          "memory": plano["memory"],
                                                                          "dev": dev,
                                                                          "plan": plano["name"],
                                                                          "schema": schema,
                                                                          "state": state,
                                                                          "machine_ip": ip,
                                                                          "machine_id" : machine_id,
                                                                          "cloud_provider": cloud_provider})

    def getLastExecutionContainer(self, user, appName, schema):
        try:
            execution = self._mongo[app.config["ADM_DATABASE"]]["executions"].find(
                {"user": user, "app": appName, "schema" : schema, "status": "running"}).sort("_id", -1).limit(1)[0]
            return execution["container"]
        except:
            return ""

    def getMachine(self, container):
        try:
            execution = self._mongo[app.config["ADM_DATABASE"]]["executions"].find(
                {"container": container}).limit(1)[0]
            return {"ip" : execution["machine_ip"], "cloud" : execution["plan"].split(".")[0], "plan" : execution["plan"], "cloud_provider" : execution["cloud_provider"]}
        except:
            return ""

    def getLastExecution(self, user, appName, schemaName):
        execution = list(self._mongo[app.config["ADM_DATABASE"]]["executions"].find(
            {"user": user, "app": appName, "schema" : schemaName, "status": "running"}).sort("_id", -1).limit(1))
        if execution == []:
            return False
        else:
            return True

    def getStatus(self, container):
        try:
            return self._mongo[self.adm_db]["executions"].find_one({"container" : container})["status"]
        except:
            return "container not created"

    def getStatusByName(self, user, app, schema):
        try:
            return self._mongo[self.adm_db]["executions"].find_one({"user" : user,
                                                                    "schema" : schema,
                                                                    "app": app},
                                                                    sort=[('_id', pymongo.DESCENDING)])["status"]
        except Exception as e:
            print(e)
            return "not running"

    def updateStatusById(self, _id, status):

        with self._mongo.start_session() as session:
            with session.start_transaction():
                if status == "running":
                    time = "start_time"
                    return self._mongo[self.adm_db]["executions"].update_one({"machine_id": ObjectId(_id), "status": "requested"}, {"$set": {"status": status, time: datetime.utcnow()}}).matched_count > 0
                elif status in ["finished", "stopped", "timeout", "error"]:
                    time = "end_time"
                    print(self._mongo[self.adm_db]["executions"].find_one({"machine_id": ObjectId(_id)}))
                    return self._mongo[self.adm_db]["executions"].update_one({"machine_id": ObjectId(_id), "status": {"$in": ["requested", "running"]}}, {"$set": {"status": status, time: datetime.utcnow()}}).matched_count > 0


    def updateUserMaxPrompt(self, user):
        self._mongo[app.config["ADM_DATABASE"]]["users"].update_one({"user" : user}, {"$inc": {"max_prompt": -1}})
        user = self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})
        return user["max_prompt"]

    def getUserMaxPrompt(self, user):
        user = self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})
        return user["max_prompt"]

    def updateStatus(self, container, status):

        with self._mongo.start_session() as session:
            with session.start_transaction():
                if status == "running":
                    time = "start_time"
                    return self._mongo[self.adm_db]["executions"].update_one({"container": container, "status": "requested"}, {"$set": {"status": status, time: datetime.utcnow()}}).matched_count > 0
                elif status in ["finished", "stopped", "timeout", "error"]:
                    time = "end_time"
                    return self._mongo[self.adm_db]["executions"].update_one({"container": container, "status": {"$in": ["requested", "running"]}}, {"$set": {"status": status, time: datetime.utcnow()}}).matched_count > 0


    def updateStatusByName(self, appName, user, status, success):
        return self._mongo[app.config["ADM_DATABASE"]]["executions"].update_one({"app": appName, "user": user, "status": "running"}, {"$set": {"status": status, "end_time": datetime.utcnow(), "success": success}})

    def createDeploy(self, appName, schema, user, state, somma_config, granularity=5):

        hour = ceil_dt(datetime.datetime.utcnow(), 5)
        self._mongo[app.config["ADM_DATABASE"]]["deploy"].insert_one({"hour": hour,
                                                                      "granularity": granularity * 60 * 1000,
                                                                      "user": user,
                                                                      "app": appName,
                                                                      "schema": schema,
                                                                      "somma_config": somma_config,
                                                                      "state": state})

    def updateUserInfo(self, user, info):
        self._mongo[app.config["ADM_DATABASE"]]["users"].update_one({"user" : user}, {"$set" : info})

    def getInfoByUser(self, user):
        return self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})

    def getUniqueUser(self):
        return self._mongo[app.config["ADM_DATABASE"]]["users"].find_one()

    def get_user_ids(self, emp, users):
        users = self._mongo[app.config["ADM_DATABASE"]]["users"].find({ "id_empresa" : emp,
                                                                        "email" : {"$in" : users}})
        return [user["_id"] for user in users]

    def get_usernames(self, ids):
        users = self._mongo[app.config["ADM_DATABASE"]]["users"].find({"_id": {"$in" : ids}})
        return [user["email"] for user in users]

    def get_emp_id(self, emp_user):
        emp = self._mongo[app.config["ADM_DATABASE"]]["empresas"].find_one({"emp_user" : emp_user})
        return emp["_id"]

    def get_user_id(self, user):
        user = self._mongo[app.config["ADM_DATABASE"]]["users"].find_one({"user" : user})
        return user["_id"]


    def find_somma_machines(self):
        '''
        Encontra os IPs para os servidores Freemium da somma
        '''
        machines = list(self._mongo[app.config["ADM_DATABASE"]]["machines"].find({"name": {'$regex': 'somma'}}))
        return machines

    def check_memory(self, ip, cloud_user, key_path):
        '''
        Dado um IP de servidor, retorna os dados sobre uso de CPU e RAM
        '''
        remote = Remote(ip, cloud_user, key_path)
        command = "free | egrep 'Mem'"
        returnedString = remote.sshCommands(command, blocking = True)
        #returnedString = returnedString.replace(",","").split("   ")
        #print(returnedString)
        #print(returnedString.split("    "))
        #print("================================================")
        if len(returnedString) == 0:
            return False
        stats = {}
        try:
            stats["total"] = float(returnedString.split("    ")[2].strip())
            stats["free"] = float(returnedString.split("    ")[3].strip())
            stats["used"] = float(returnedString.split("    ")[4].strip())
        except:
            stats["total"] = 100000000
            stats["free"] = 32000000
            stats["used"] = 32000000

        return stats
