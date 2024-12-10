from project import app
from flask import Flask, flash, redirect, render_template, request, session, jsonify, send_from_directory, send_file
from flask import url_for, escape, request
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
from project.models.datasets import DataSet
import json
import os
import requests
import pandas as pd
import os
from project.models.management import Management


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()
dataset_extensions = ["csv", "xlsx", "json", "xls", "geojson"]

@app.route('/delete-component', methods=['POST'])
def delete_component():

    if session.get('logged_in'):
        if request.method == "POST":
            name = request.form.get("name")
            datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
            return jsonify({"success" : datasets.delete_component(name), "name" : name})
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})

@app.route('/delete-dataset', methods=['POST'])
def delete_dataset():

    if session.get('logged_in'):
        if request.method == "POST":
            name = request.form.get("dataset_name")
            datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
            return jsonify(datasets.delete_dataset(name))

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})



@app.route('/get-components', methods=['GET'])
def get_components():

    if session.get('logged_in'):
        if request.method == "GET":
            datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
            return jsonify(datasets.read_components())
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/upload-components', methods=['POST'])
def upload_components():

    if session.get('logged_in'):

        if request.method == 'POST':
            files = request.files.to_dict()
            params = json.loads(request.form["component-json"])
            datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
            if datasets.update_components(files, params):
                return render_template("custom_components/custom_components.html")

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})

@app.route('/upload-file', methods=['POST'])
def upload():

    if session.get('logged_in'):
        if request.method == 'POST':

            f = request.files['file']
            name = str(request.form['collection_name'])
            if name == "":
                name = f.filename.split(".")[0]
            extension = f.filename.split(".")[-1]

            datasets = DataSet(str(session.get("user")), str(session.get("pwd")))

            metatributos = {}

            '''
            atributos = {}
            atributos["somma_datetime"] = str(request.form['somma_datetime'])
            atributos["somma_category_1"] = str(request.form['somma_category_1'])
            atributos["somma_category_2"] = str(request.form['somma_category_2'])
            atributos["somma_category_3"] = str(request.form['somma_category_3'])
            atributos["somma_category_4"] = str(request.form['somma_category_4'])
            atributos["somma_category_5"] = str(request.form['somma_category_5'])
            for atributo in atributos:
                if atributos[atributo] != "":
                    metatributos[atributo] = atributos[atributo]

            '''


            if extension in dataset_extensions:
                tipo = "dataset"
                result = datasets.insert_collection(f, name, extension, metatributos)
                if result["success"]:
                    return jsonify({"name": name, "type": tipo})
                else:
                    raise InvalidUsage(result["message"], status_code=415)
            else:
                raise InvalidUsage("Invalid File Extension", status_code=415)

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/get-datasets', methods=['GET'])
def get_datasets():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):
        datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
        datasets, _, _, _ = datasets.read_collections()
        return jsonify(datasets)


@app.route("/download-dataset/<dataset>", methods=['GET'])
def get_dataset(dataset):


    if session.get('logged_in'):
        datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
        registers = datasets.getDownloadDataset(dataset)
        df = pd.DataFrame(registers)

        import io
        s_buf = io.StringIO()
        df.drop(["_id"], axis = 1).to_csv(s_buf, index=False)
        mem = io.BytesIO()
        mem.write(s_buf.getvalue().encode('utf-8'))
        mem.seek(0)
        s_buf.close()

        return send_file(
            mem,
            as_attachment=True,
            attachment_filename=dataset + '.csv',
            mimetype='text/csv')


@app.route('/datasets', methods=['GET'])
def data_objects():
    '''
        Esta rota é resposável pelo carregar o dataSet
    '''
    if session.get('logged_in'):

        datasets = DataSet(str(session.get("user")), str(session.get("pwd")))
        collection = request.args.get("collection", "")

        data = {}

        data["datasets"], data["files"], data["db_size"], data["col_avg_size"] = datasets.read_collections()


        if collection == "":
            data["dados"] = False
            data["page"] = 0
        else:
            page = request.args.get("page", "")
            if page == "":
                page = 0

            field = request.args.get("field", "")
            option = request.args.get("option", "")
            value = request.args.get("value", "")

            if "null" in [field, value, option]:
                field = value = option = None

            query = (field, option, value)

            if not collection.startswith("workspace."):
                data["stream_size"], data["total_pages"], data["storage_size"] = datasets.get_docs_count(collection, query)

            page = int(page)

            if page > data["total_pages"] - 1:
                page = data["total_pages"] - 1
            elif page < 0:
                page = 0

            stream, tipo, fields, types = datasets.read_datasets(collection, page, field, option, value)

            #for obj in stream:
            #    if tipo == "dataset":
                    #obj.update(obj["data_object"])
                    #del obj["data_object"]
                    #if "somma_geospatial" in obj:
                    #    obj["somma_geospatial"] = json.dumps(obj["somma_geospatial"])
                        #print(obj["somma_geospatial"])
                    #print(obj)

            data["dados"] = True
            data["stream"] = stream

            data["page"] = int(page)
            data["collection"] = collection
            data["fields"] = fields
            data["types"] = types
            data["field"] = field
            data["option"] = option
            data["value"] = value

            '''data.append("dados")
            data.append(dataset)
            data.append(stream)
            '''


        return render_template('datasets/datasets.html', data=data)
    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})



'''

    datasets = DataSet()
    collection = request.args.get("collection", "")

    if collection == "":
        data = datasets.read_collections()
    else:
        stream = datasets.read_datasets(collection)

        for obj in stream:
            obj.update(obj["data_object"])
            del obj["data_object"]
            print(obj)


        data = ["dados"]  + stream
'''
