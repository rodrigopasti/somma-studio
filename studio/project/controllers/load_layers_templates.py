from project import app
from flask import request, render_template, jsonify, session
import json
import os

@app.route('/load-layers-templates', methods=['GET', 'POST'])
def load_layers_templates():
    '''
    Esta rota é responsável por ler os templates dos documentos
    '''

    if session.get('logged_in'):

        if request.method == 'GET':
            pathJSONs = os.getcwd() + "/project/templates/layers_templates/"
            '''
            Fazer a leitura dos arquivos de template e colocar tudo em um único
            dicionário
            '''
            #Ler nomes de arquivos
            filesNames = list(set(os.listdir(pathJSONs)))
            layersTemplates = {}
            for jsonName in filesNames:
                file = open(pathJSONs + jsonName, 'r')
                templatesInFile = json.load(file)
                layersTemplates[jsonName.split(".")[0]] = templatesInFile
                file.close()

        return jsonify(layersTemplates)
        #return render_template('save_schema/save-schema.html')

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
