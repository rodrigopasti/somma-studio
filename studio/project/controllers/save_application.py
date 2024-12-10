from project import app
from flask import request, render_template, session,jsonify
import json
from project.models.mongo_files import MongoFiles
from project.controllers.redissession import RedisSessionInterface
from flask_session import Session
import os
import copy

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

def verifyStringSize(string):
    if len(string) > 25:
        if string[25] == "*" and string.rsplit("*", 1)[1].isnumeric():
            return True
        else:
            return False
    else:
        return True


@app.route('/save-application', methods=['GET', 'POST'])
def save_application():
    '''
    Esta rota é responsável pelo save schema
    '''
    if session.get('logged_in'):

        if request.method == 'POST':
            ''''
            Recebendo valor através do POST
            '''
            mongoFiles = MongoFiles(str(session.get("user")), str(session.get("pwd")))
            data = request.data
            jsonReceived = json.loads(data.decode("utf8"))

            if not verifyStringSize(jsonReceived["info"]["application_name"]):
                return jsonify("Application name cannot be greater than 25 characters"),405

            jsonStudio = jsonReceived["studio_schemas"]
            applicationName = jsonReceived["info"]["application_name"]
            schemas = list(jsonStudio.keys())
            nSchemas = len(schemas)

            '''
            Fazer a leitura dos arquivos de template e colocar tudo em um único
            dicionário, o qual será usado para inferir comportamentos de save
            '''
            pathJSONs = os.getcwd() + "/project/templates/components_templates/"
            #Ler nomes de arquivos
            filesNames = list(set(os.listdir(pathJSONs)))
            componentsTemplates = {}
            for jsonName in filesNames:
                file = open(pathJSONs + jsonName, 'r')
                templatesInFile = json.load(file)
                componentsTemplates.update(templatesInFile)
                file.close()
            '''
            Convertendo para o formato do somma core (um arquivo por definição)
            '''
            jsonReceived["core_schemas"] = {}
            for iSchema in range(nSchemas):
                schema = schemas[iSchema]
                nConnections = len(jsonStudio[schema]["connections"])
                nComponents = len(jsonStudio[schema]["components"])
                schemaCore = {}
                schemaCore["components_connections"] = []
                schemaCore["components_parameters"] = {}
                for iComponent in range(nComponents):
                    #relation = {"component":, "input": , "output": }
                    connectionCore = {}
                    connectionCore["component"] = jsonStudio[schema]["components"][iComponent]["parameters"]["name"]

                    #Procurando quantas conexões de entrada o componente possui
                    nOutputs = 0
                    for iCon in range(nConnections):
                        connection = jsonStudio[schema]["connections"][iCon]
                        if connection["target_name"] == connectionCore["component"]:
                            nOutputs = nOutputs + 1
                    connectionCore["input"] = [None for _ in range(nOutputs)]

                    for iCon in range(nConnections):
                        connection = jsonStudio[schema]["connections"][iCon]
                        if connection["target_name"] == connectionCore["component"]:
                            connectionCore["input"][int(connection["connection_index_target"])-1] = connection["source_name"]

                    #Compondo as conexões de saída no formato core
                    #Verifica quantas possíveis entradas possui de modo a definir o
                    #tamanho da lista para inserir na posição correta
                    nInputs = 0
                    for iCon in range(nConnections):
                        connection = jsonStudio[schema]["connections"][iCon]
                        if connection["source_name"] == connectionCore["component"]:
                            nInputs = nInputs + 1
                    connectionCore["output"] = [None for _ in range(nInputs)]

                    #Verifica ordem e adiciona
                    for iCon in range(nConnections):
                        connection = jsonStudio[schema]["connections"][iCon]
                        if connection["source_name"] == connectionCore["component"]:
                            connectionCore["output"][int(connection["connection_index_source"])-1] = connection["target_name"]
                            #connectionCore["input"].append(connection["source_name"])
                    schemaCore["components_connections"].append(connectionCore)

                    #Ajustando os parâmetros
                    name = jsonStudio[schema]["components"][iComponent]["parameters"]["name"]
                    parameters = dict()
                    parameters = copy.copy(jsonStudio[schema]["components"][iComponent]["parameters"])
                    parametersStudio = jsonStudio[schema]["components"][iComponent]["parameters"]


                    '''
                    Convertendo strings para estruturas de dados. Se o parâmetro for um dicionário ou lista,
                    faz a conversão.
                    Faz a conversão de números para int e float em dicionários e subdicionários. Suporta:
                    (1) Listas de dicionários
                    (2) Dicionários em dicionários (dois níveis)
                    (3) Lista de dicionários em dicionários (três níveis)
                    '''

                    for parameterName in parameters.keys():
                        try:
                            if len(parameters[parameterName]) > 0:
                                if (parameters[parameterName][0] == "{" or parameters[parameterName][0] == "[") and len(parameters[parameterName]) > 2:
                                    stage1 = parameters[parameterName].replace('{','{"').replace('}','"}').replace(':','":"').replace(',', '","').replace('[', '["').replace(']','"]')
                                    stage2 = stage1.replace('"[','[').replace(']"',']').replace('"{','{').replace('}"','}')#.replace('","',',')
                                    d = json.loads(stage2)

                                    if type(d) == list:
                                        nEl = len(d)
                                        for iEl in range(nEl):
                                            el = d[iEl]
                                            if type(el) == dict:
                                                for dkey in el.keys():
                                                    innerd = el[dkey]
                                                    if type(el[dkey]) == dict:
                                                        for innerdkey in el[dkey].keys():
                                                            if type(el[dkey][innerdkey]) == str:
                                                                try:
                                                                    el[dkey][innerdkey] = int(el[dkey][innerdkey])
                                                                except:
                                                                    try:
                                                                        el[dkey][innerdkey] = float(el[dkey][innerdkey])
                                                                    except:
                                                                        continue
                                                    else:
                                                        if type(el[dkey]) == str:
                                                            try:
                                                                el[dkey] = int(el[dkey])
                                                            except:
                                                                try:
                                                                    el[dkey] = float(el[dkey])
                                                                except:
                                                                    continue
                                            else:
                                                try:
                                                    d[iEl] = float(d[iEl])
                                                except:
                                                    try:
                                                        d[iEl] = int(d[iEl])
                                                    except:
                                                        d[iEl] = d[iEl].strip()
                                                        continue

                                    else:
                                        for dkey in d.keys():
                                            if type(d[dkey]) == dict:
                                                innerd = d[dkey]
                                                for innerdkey in d[dkey].keys():
                                                    if type(d[dkey][innerdkey]) == str:
                                                        try:
                                                            d[dkey][innerdkey] = float(d[dkey][innerdkey])
                                                        except:
                                                            try:
                                                                d[dkey][innerdkey] = int(d[dkey][innerdkey])
                                                            except:
                                                                continue

                                    parameters[parameterName] = d

                                elif parameters[parameterName][0] == "{" and len(parameters[parameterName]) <= 2:
                                    parameters[parameterName] = {}
                                elif parameters[parameterName][0] == "[" and len(parameters[parameterName]) <= 2:
                                    parameters[parameterName] = []
                                elif parameters[parameterName] == "true" or parameters[parameterName] == "false":
                                    #parameters[parameterName] = False if parameters[parameterName] == "false" else True
                                    if parameters[parameterName] == "false":
                                        parameters[parameterName] = False
                                        parametersStudio[parameterName] = False
                                    else:
                                        parameters[parameterName] = True
                                        parametersStudio[parameterName] = True
                                else:
                                    idName = jsonStudio[schema]["components"][iComponent]["parameters"]["id_name"]
                                    if "textlist" in componentsTemplates[idName][parameterName]:
                                        splitedValues = parameters[parameterName].replace("]","").split(",")      
                                        parameters[parameterName] = []
                                        for i in range(len(splitedValues)):
                                            if len(splitedValues[i]) > 0:
                                                '''
                                                OBSERVACAO>>>>>>
                                                Fazer um try para tentar capturar se é inteiro ou float??
                                                '''
                                                parameters[parameterName].append(splitedValues[i].strip())
                                    else:
                                        try:
                                            parameters[parameterName] = int(parameters[parameterName])
                                        except:
                                            try:
                                                parameters[parameterName] = float(parameters[parameterName])
                                            except:
                                                continue
                            else:
                                idName = jsonStudio[schema]["components"][iComponent]["parameters"]["id_name"]
                                if "textlist" in componentsTemplates[idName][parameterName]:
                                    parameters[parameterName] = []
                                else:
                                    parameters[parameterName] = ""

                        except:
                            #Se tudo der errado, ainda salva como string
                            continue
                    schemaCore["components_parameters"][name] = parameters

                jsonReceived["core_schemas"][schemas[iSchema]] = schemaCore
                #for c in jsonReceived["core_schemas"][schemas[iSchema]]["components_parameters"].keys():
                #    print(jsonReceived["core_schemas"][schemas[iSchema]]["components_parameters"][c])
                #    print("-----------------")
            mongoFiles.save_application_files(jsonReceived, applicationName)

        return "application saved"
        #return render_template('save_schema/save-schema.html')

    else:
        return render_template("login/login.html", data = {"version": app.config["SOMMA_VERSION"]})
