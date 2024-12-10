import openai
import os
import numpy as np
import json
import time
from project import app
from flask import request, render_template, jsonify, session
from project.models.management import Management
from project.controllers.redissession import RedisSessionInterface
from flask_cognito_extended import (
    jwt_required
)

app.config['SECRET_KEY'] = os.urandom(24)
app.config["SESSION_TYPE"] = 'redis'
app.session_interface = RedisSessionInterface()

openai.organization = os.environ["OPENAI_ORG"]
openai.api_key = os.environ["OPENAI_KEY"]

@app.route('/generate-prompt', methods=['POST'])
def generate_prompt():
    management = Management()
    
    if request.method == "POST":
        user_max_prompt = management.getUserMaxPrompt(session.get('user'))
        if user_max_prompt > 0:
            prompt_input = request.form.get("input") 

            # create a chat completion
            system_msg = "You are a Data Scientist developer assistant. You must talk about classes, code, algorithm, datasets fields and python programming. Other topics you must reply 'I don't know. I can only assist you to create your components :)'"
            base_msg_pandas = """"
            This function must be written in python and must be named 'input'. This function has two arguments. The first one is a Pyspark dataframe, and the second one is a variable named meta_data. Convert the received dataframe to a Pandas dataframe. The function must return a new dataframe with results and the original columns and the meta_data variable. The class must have the 'object' argument, and the class must have a constructor that has an argument called 'parameters'. Inside this constructor attributes the argument 'parameters' received in another variable called 'self.parameters'. In the end of the function, convert the resulting dataframe to a PySpark dataframe. Don't forget to import the SparkSession!
            Add the following statement at the first line of the 'input' function: 'print = lambda *args, **kwargs: meta_data["logger"].info(args, kwargs=kwargs)'.
            Ensure that the parameters of all called Pandas functions have the correct data types. If not, convert each parameter.
            Don't use the 'raise' keyword in exceptions, instead print the error and add 'return None, None'.
            Don't write the example usage.
            """
            base_msg_any = """"
            This function must be written in python and must be named 'input'. This function has two arguments. The first one is a dataframe, and the second one is a variable named meta_data. The function must return a new dataframe with results and the original columns and the meta_data variable. The class must have the 'object' argument, and the class must have a constructor that has an argument called 'parameters'. Inside this constructor attributes the argument 'parameters' received in another variable called 'self.parameters'. 
            Add the following statement at the first line of the 'input' function: 'print = lambda *args, **kwargs: meta_data["logger"].info(args, kwargs=kwargs)'.
            Don't use the 'raise' keyword in exceptions, instead print the error and add 'return None, None'.
            Don't write the example usage.
            """
            if "pandas" in prompt_input.lower():
                prompt_input = prompt_input + " " + base_msg_pandas
            else:
                prompt_input = prompt_input + " " + base_msg_any
            chat_completion = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": prompt_input}])
            user_max_prompt = management.updateUserMaxPrompt(session.get('user'))
            return {"max_prompt": user_max_prompt, "output": chat_completion.choices[0].message.content}
        else:
            return 'Exceed max_prompt use'
    #else:
    #    return "User company not allowed"


@app.route('/generate-prompt-schema', methods=['POST'])
def generate_prompt_schema():
    management = Management()

    if request.method == "POST":
        try:
            first_component = request.form.get('component_id').split('-xx-')[0] if request.form.get('component_id') else ""

            init_time = time.time()
            #PARAMETERS
            #linear_flow = True #Liga os componentes ao primeiro ou todos em sequência OBS: será usado em futuro breve

            prompt = request.form.get("prompt")
            openai.organization = "YOUR_ORG_HERE"
            openai.api_key = "YOUR_API_KEY_HERE"
            pathJSONs = os.getcwd() + "/project/templates/components_templates/"

            #requests.form.get("prompt")

            #EXEMPLOS
            #prompt = "'Load dataset iris from somma. Delete the petal_lenght attribute. Calculate statistics about variety. Make a prediction on variety and using random forest. Plot a graph using bar plot type, using variety and max_petal_length'"
            #prompt = "'I need to predict the variety."# Do a data cluestering. Extract Statistics on variety attribute'"
            #prompt = "Make a classification on variety."
            #prompt = "'Plot a graph using the bar graph type and using variety and max_petal_length'"
            #prompt = "'Load dataset from somma. Calculate statistics. Make a regression. Plot a graph'"
            #prompt = "Select the variety attribute. Do a grouped stats on variety."


            msg_content = "Consider the following options: \n\n"


            filesNames = list(set(os.listdir(pathJSONs)))
            componentsTemplates = {}
            for jsonName in filesNames:
                if jsonName != "components_aliases.json" and jsonName != "parameters_aliases.json":
                    file = open(pathJSONs + jsonName, 'r')
                    templatesInFile = json.load(file)
                    componentsTemplates.update(templatesInFile)

            i = 1
            compNames = list(componentsTemplates.keys())
            compNames.sort()
            listOpt = []
            for comp in compNames:
                #print("Option " + str(i) + ": " + componentsTemplates[comp]["help"])
                #opt = "Option " + str(i) + ": " + componentsTemplates[comp]["help"] + "\n"
                # print(comp)
                opt = "Option " + "- " +  comp +  " - " + componentsTemplates[comp]["help"] + "\n"
                listOpt.append(opt)
                i = i + 1
                '''
                for param in componentsTemplates[comp].keys():
                    print(param)
                    if "help" in param:
                        print(param)
                        #param["help"]
                        opt = "Option " + "- " +  comp +  " - " + param["help"] + "\n"
                        i = i + 1
                '''
                msg_content = msg_content + opt

            msg_content = msg_content + "\nConsider the following description: \n"


            msg_content = msg_content + prompt + "\n\n"

            #msg_content = msg_content + "max_petal_length, petal_lenght, variety are attributes or columns \n\n"

            msg_content = msg_content +  "Return a Python list named list_opt of the options that exist in this description. Use the order found in the description."


            msg_content = msg_content +  "Return the attribute names found in this description in a Python list named list_att. "

            msg_content = msg_content +  "\n\nReturn a Python list named list_association of the association between the options and the attributes found in the description. Important: use a list of tuples. The tuples must be of maximum length equal to 2. Put everything in the same line."


            #msg_content = msg_content +  "\n\nThe parameters are plot_type. Return a Python list named list_association_params of the association between the options and the parameters found in the description."

            chat_completion = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": msg_content}])
            chat_answer = chat_completion.choices[0].message.content

            chat_answer = chat_answer.replace("\n", ' ')
            chat_answer = chat_answer.replace("]",']\n')


            #Encontrando lista de opções (componentes) e a lista de associações no texto 

            try:
                for line in chat_answer.splitlines():
                    if "list_opt" in line:
                        strOpt = line.replace("list_opt", "").replace("=", "").replace(":","").replace("[","").replace("]","").replace("'","").replace('"',"").strip()
                        listOptFound = strOpt.split(",")
                
                    if "list_association" in line:
                        listAssociationFound = eval(line.replace(":", "=").split("=")[1])
            except Exception as e:
                return {'error': e}
                

            componentsFound = []
            for optFound in listOptFound:
                for opt in listOpt:
                    if optFound.strip() in opt:
                        componentsFound.append(opt.split("-")[1].strip())
                
            dictAssociationFound = {assoc[0]:assoc[1] for assoc in listAssociationFound} 

            componentsInAssociation = list(dictAssociationFound.keys())
            jsonToReturn = {"components":{},"connections":[]}
            forbiddenParams = ["icon_type", "grid_config", "help", "help_link"]
            for comp in componentsFound:
                jsonToReturn["components"][comp] = {}
                param_value_association = None
                if comp in componentsInAssociation:
                    param_value_association = dictAssociationFound[comp]

                for param in componentsTemplates[comp]:
                    if param not in forbiddenParams:
                        if type(componentsTemplates[comp][param]) == dict:
                            param_type = [k for k in componentsTemplates[comp][param].keys() if k not in ["help", "required"]]
                            param_type = param_type[0]
                            if type(componentsTemplates[comp][param][param_type]) == list:
                                if param_type == "multiselect":
                                    param_value = componentsTemplates[comp][param][param_type]
                                else:
                                    if len(componentsTemplates[comp][param][param_type]) > 0:
                                        param_value = componentsTemplates[comp][param][param_type][0]
                                    else:
                                        param_value = ""
                            else:
                                param_value = componentsTemplates[comp][param][param_type]
                
                            if param == "attribute" and param_value_association != None:
                                jsonToReturn["components"][comp][param] =  param_value_association
                            elif param == "attributes" and param_value_association != None:
                                jsonToReturn["components"][comp][param] =  [param_value_association]
                            elif param in ["dataset","dataset_learning"] and comp == "Load Data Objects" and param_value_association != None:
                                jsonToReturn["components"][comp][param] =  param_value_association
                            elif param in ["x","y"] and comp == "Simple Graphs" and param_value_association != None:
                                jsonToReturn["components"][comp][param] =  [param_value_association]
                            elif param == "name":
                                jsonToReturn["components"][comp][param] =  comp + str(np.random.randint(10000))
                            else:
                                jsonToReturn["components"][comp][param] = param_value
                        else:
                            param_value = componentsTemplates[comp][param]
                            jsonToReturn["components"][comp][param] = param_value



            #"connections": [
            #       {
            #           "sourceComp": "Load Data Objects",
            #           "targetComp": "Print Data"
            #       }
            #   ]

            if first_component != "":
                componentsFound = [first_component] + componentsFound

            nComps = len(componentsFound)
            for iComp in range(nComps-1):
                comp = componentsFound[iComp]
                conn = {"sourceComp":"", "targetComp": ""}
                conn["sourceComp"] = componentsFound[iComp]
                conn["targetComp"] = componentsFound[iComp+1]
                jsonToReturn["connections"].append(conn)
            
            return json.dumps(jsonToReturn)
        
        except Exception as e:
            print(e)
            return {'error': e}