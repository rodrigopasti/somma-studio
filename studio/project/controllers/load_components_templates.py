from project import app
from flask import request, render_template, jsonify, session
import json
import os

@app.route('/load-components-templates', methods=['GET', 'POST'])
def load_templates():
    '''
    Esta rota é responsável por ler os templates dos documentos
    '''

    if session.get('logged_in'):

        if request.method == 'GET':
            pathJSONs = os.getcwd() + "/project/templates/components_templates/"
            '''
            Fazer a leitura dos arquivos de template e colocar tudo em um único
            dicionário
            '''
            #Ler nomes de arquivos
            filesNames = list(set(os.listdir(pathJSONs)))
            componentsTemplates = {}
            for jsonName in filesNames:
                if jsonName != "components_aliases.json":
                    file = open(pathJSONs + jsonName, 'r')
                    templatesInFile = json.load(file)
                    componentsTemplates.update(templatesInFile)
                    file.close()


        return jsonify(componentsTemplates)
        #return render_template('save_schema/save-schema.html')

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/load-components-aliases', methods=['GET', 'POST'])
def load_components_aliases():
    '''
    Esta rota é responsável por ler os nomes antigos dos componentes que foram alterados
    '''

    if session.get('logged_in'):

        if request.method == 'GET':
            path = os.getcwd() + "/project/templates/components_templates/components_aliases.json"
            componentAliases = {}
            file = open(path, 'r')
            aliases = json.load(file)
            componentAliases.update(aliases)
            file.close()
                
            print(componentAliases)

        return jsonify(componentAliases)
        #return render_template('save_schema/save-schema.html')

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})


@app.route('/load-parameters-aliases', methods=['GET', 'POST'])
def load_parameters_aliases():
    '''
    Esta rota é responsável por ler os nomes antigos dos componentes que foram alterados
    '''

    if session.get('logged_in'):

        if request.method == 'GET':
            path = os.getcwd() + "/project/templates/components_templates/parameters_aliases.json"
            parametersAliases = {}
            file = open(path, 'r')
            aliases = json.load(file)
            parametersAliases.update(aliases)
            file.close()
                
            print(parametersAliases)

        return jsonify(parametersAliases)
        #return render_template('save_schema/save-schema.html')

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})