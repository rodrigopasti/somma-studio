/*
Funções de controle da janela de avisos e alertas da análise da aplicação
*/

/*
Função que faz o print da análise da aplicação na janela de análise
recebe o jsonAppStatus gerado pela função checkApplication
*/
function setWindowAnalysis(jsonAppStatus, isValidApplication) {
  $("#analysis_table tr").remove();
  schemasInApp = Object.keys(jsonAppStatus);
  analysisTable = document.getElementById("analysis_table");
  analysisTypes = Object.keys(jsonAppStatus[schemasInApp[0]]);
  var appButton = document.getElementById("application_analysis_button")
  if (isValidApplication == false) {
    appButton.style.backgroundImage = "url('../../static/icons/app_analysis_error_icon.svg')"
  }
  else {
    appButton.style.backgroundImage = "url('../../static/icons/app_analysis_icon.svg')"

  }


  //Listar para cada schema
  for (iSchema = 0; iSchema < schemasInApp.length; iSchema++) {

    jsonAppStatus[schemasInApp[iSchema]]["isEmpty"] == true ? isEmpty = true : isEmpty = false

    line = document.createElement('tr');
    col = document.createElement('td');
    col.setAttribute("class", "app_analysis_row_1");
    //col.setAttribute("style", "height: 12px;");
    col.textContent = schemasInApp[iSchema];
    line.appendChild(col);
    analysisTable.appendChild(line);
    errorsFound = false;
    //Segmentar por tipo de análise
    for (iType = 0; iType < analysisTypes.length; iType++) {
      componentesInStatus = jsonAppStatus[schemasInApp[iSchema]][analysisTypes[iType]];
      stringToPrint = analysisTypes[iType];
      if (componentesInStatus.length > 0) {
        errorsFound = true;
        line = document.createElement('tr');
        col = document.createElement('td');
        col.setAttribute("class", "app_analysis_row_2");
        for (i = 0; i < componentesInStatus.length; i++) {
          if (i == 0) {
            stringToPrint = stringToPrint + ": " + componentesInStatus[i];
          }
          else {
            stringToPrint = stringToPrint + ", " + componentesInStatus[i];
          }
        }
        col.textContent = stringToPrint;
        line.appendChild(col);
        analysisTable.appendChild(line);
      }
      //else{
      //  stringToPrint = stringToPrint + ": none";
      //}
    }

    if (jsonAppStatus[schemasInApp[iSchema]]["isEmpty"] == true) {
      line = document.createElement('tr');
      col = document.createElement('td');
      col.setAttribute("class", "app_analysis_row_2");
      col.textContent = "Empty Schema";
      line.appendChild(col);
      analysisTable.appendChild(line);
    }
    if (errorsFound == false && isEmpty == false) {
      line = document.createElement('tr');
      col = document.createElement('td');
      col.setAttribute("class", "app_analysis_row_2");
      col.textContent = "OK";
      line.appendChild(col);
      analysisTable.appendChild(line);
    }
  }
  //Adicionar mais N linhas em branco
  for (i = 0; i < 3; i++) {
    line = document.createElement('tr');
    col = document.createElement('td');
    col.setAttribute("class", "app_analysis_row_1");
    col.innerHTML = "&nbsp";
    line.appendChild(col);
    analysisTable.appendChild(line);
  }
} // fim da função setWindowAnalysis


/*
Função para verificar se há componentes com nomes iguais em um esquema
*/
var equalNames;
function checkEqualNames(componentsName) {
  return componentsName.some(function (item) {
    equalNames = []
    equalNames.push(item)
    return componentsName.indexOf(item) !== componentsName.lastIndexOf(item);
  });
}
/*
Funções da análise da aplicação
*/
function checkApplication() {
  schemasWithErrors = []; //Armazenará os esquemas que estão com erro
  jsonAppStatus = {}; //Retorna o status da aplicação por schema
  jsonSchemas = getSchemas() //applicationsControl
  componentsTemplates = getComponentsTemplates(); //applicationsControl
  schemasList = Object.keys(jsonSchemas)
  customComponentsList = Object.keys(customComponents)
  isValidApplication = true;

  /*
  Verificação para cada schema
  */

  isValidSchemas = {}
  for (iSchema = 0; iSchema < schemasList.length; iSchema++) {
    jsonAppStatus[schemasList[iSchema]] = {}
    components = jsonSchemas[schemasList[iSchema]]["components"];
    connections = jsonSchemas[schemasList[iSchema]]["connections"];


    jsonAppStatus[schemasList[iSchema]]["Components with the same name"] = [];
    componentsName = []
    for (var iComp = 0; iComp < components.length; iComp++) {
      componentsName.push(components[iComp]["parameters"]["name"])
    }
    /*
    Juntar todas os id_names de componentes que estão em source_id e target_id de uma conexão
    para ser usado na verificação de conexões
    */
    targetConnectionsList = [];
    sourceConnectionsList = [];
    for (iConn = 0; iConn < connections.length; iConn++) {
      sourceConnectionsList.push(connections[iConn]["source_name"])
      targetConnectionsList.push(connections[iConn]["target_name"])
    }

    /*
    Juntar todos os nomes de datasets que estão em load data objects
    */
    datasetsList = [];
    if (checkEqualNames(componentsName)) {
      jsonAppStatus[schemasList[iSchema]]["Components with the same name"].push(equalNames)
      isValidSchemas[schemasList[iSchema]] = false
    }
    for (iComp = 0; iComp < components.length; iComp++) {
      if (components[iComp]["parameters"]["id_name"] == "Load Data Objects") {
        datasetsList.push(components[iComp]["parameters"]["dataset"]);
      }
    }
    /*
    Verificação da consistência e erros para cada componente
    */
    jsonAppStatus[schemasList[iSchema]]["isEmpty"];
    jsonAppStatus[schemasList[iSchema]]["Custom component does not exist in library"] = [];
    jsonAppStatus[schemasList[iSchema]]["Field cannot contain special characters"] = [];
    jsonAppStatus[schemasList[iSchema]]["missing required parameters"] = [];
    jsonAppStatus[schemasList[iSchema]]["missing connections"] = [];
    jsonAppStatus[schemasList[iSchema]]["datasets error"] = [];
    analysisTypes = Object.keys(jsonAppStatus[schemasList[iSchema]]);

    for (iComp = 0; iComp < components.length; iComp++) {
      isValid = true;

      components[iComp]["parameters"]["id_name"] = componentsTemplates[components[iComp]["parameters"]["id_name"]] ? components[iComp]["parameters"]["id_name"]
        : componentsAliases[components[iComp]["parameters"]["id_name"]]

      idName = components[iComp]["parameters"]["id_name"];

      parameters = components[iComp]["parameters"];
      parametersInTemplate = componentsTemplates[idName];
      if (!nativeComponents.includes(idName)) {
        if (!customComponentsList.includes(idName)) {
          isValid = false
          jsonAppStatus[schemasList[iSchema]]["Custom component does not exist in library"].push(idName)
        }

      }

      if (parametersInTemplate == undefined) {
        continue
      }
      parametersList = Object.keys(components[iComp]["parameters"])


      var $componentElem = $(document.getElementById(components[iComp]["div_id"]));
      //var $compErrorExclamation = $(document.getElementById("comp_error_exclamation_" + components[iComp]["div_id"]));

      var compErrorExclamation = document.getElementById("comp_error_exclamation_" + components[iComp]["div_id"]);
      var componentGraphIcon = document.getElementById("graph_icon_" + components[iComp]["div_id"]);

      if ("component_type" in parametersInTemplate)
        componentType = parametersInTemplate["component_type"]

      form = document.getElementById('parameters_form_' + $componentElem.attr('id'));


      for (var iParam = 0; iParam < parametersList.length; iParam++) {
        /*
        Verificação de parâmetros requeridos
        */
        if (typeof parametersInTemplate[parametersList[iParam]] == "object") {
          if ("required" in parametersInTemplate[parametersList[iParam]]) {
            if (parametersInTemplate[parametersList[iParam]]["required"] == true) {
              if (parameters[parametersList[iParam]] == "" || parameters[parametersList[iParam]] == "undefined") {
                let parameterElement = form.querySelector('[name="' + parametersList[iParam] + '"]');
                parameterElement.setAttribute("style", "border-color: red; border-style: solid");
                if (parameterElement.nodeName == "SELECT" && parameterElement.multiple == true) {
                  setTimeout(function () {
                    parameterElement.parentElement.querySelector('ul').parentElement.setAttribute("style", "border-color: red !important; border-style: solid !important")
                  }, 200);
                }
                else {
                  parameterElement.setAttribute("style", "border-color: red; border-style: solid");
                }
                isValid = false;
                jsonAppStatus[schemasList[iSchema]]["missing required parameters"].push(components[iComp]["parameters"]["name"])
              }
              else {
                let parameterElement = form.querySelector('[name="' + parametersList[iParam] + '"]');

                if (parameterElement.nodeName == "SELECT" && parameterElement.multiple == true) {
                  setTimeout(function () {
                    parameterElement.parentElement.querySelector('ul').parentElement.setAttribute("style", "border-style: transparent")
                  }, 200);
                }
                else parameterElement.setAttribute("style", "border-style: transparent");
              }
            }
          }
        } //fim do for

        /*
        Verificação se um dataset em save data objects não está contido em
        algum load data objects
        */
        if (idName == "Save Data Objects" && parametersList[iParam] == "dataset") {
          if (datasetsList.includes(parameters[parametersList[iParam]]) == true) {
            isValid = false;
            jsonAppStatus[schemasList[iSchema]]["datasets error"].push(components[iComp]["parameters"]["name"])
          }
        }
        /*
        Verificação se o campo dataset está vazio ou undefined para não necessitar abrir o componentMenu
        */
        if (idName == "Load Data Objects" && parametersList[iParam] == "dataset") {
          let parameterElement = form.querySelector('[name="' + parametersList[iParam] + '"]');
          if (parameters[parametersList[iParam]] == "" || parameters[parametersList[iParam]] == "undefined") {
            parameterElement.setAttribute("style", "border-color: red");
            isValid = false;
          }
        }
      }
      /*
      Verificação de inconsistências nas conexões
      O componente deve estar em pelo menos um target na lista de conexões,
      caso contrário, possui conexão faltante
      */
      if (parametersInTemplate["component_type"] == "input") {
        if (sourceConnectionsList.includes(components[iComp]["parameters"]["name"]) == false) {
          isValid = false;
          jsonAppStatus[schemasList[iSchema]]["missing connections"].push(components[iComp]["parameters"]["name"])
        }
      }
      else {
        if (targetConnectionsList.includes(components[iComp]["parameters"]["name"]) == false) {
          isValid = false;
          jsonAppStatus[schemasList[iSchema]]["missing connections"].push(components[iComp]["parameters"]["name"])
        }
      }
      if (isValid == false) {
        //$componentElem.css("outline-style","solid");
        //$componentElem.css("outline-color","red");
        //$componentElem.css("outline-radius","9px");
        //$compErrorExclamation.css("visible",true);
        compErrorExclamation.style.visibility = "visible";
        componentGraphIcon.style.visibility = 'hidden'
        strErrorLabel = "Errors: ";
        errorFound = false;
        for (iAnalysis = 0; iAnalysis < analysisTypes.length; iAnalysis++) {
          if (jsonAppStatus[schemasList[iSchema]][analysisTypes[iAnalysis]].includes(components[iComp]["parameters"]["name"])) {
            if (errorFound == false) {
              strErrorLabel = strErrorLabel + " " + analysisTypes[iAnalysis];
              errorFound = true;
            }
            else {
              strErrorLabel = strErrorLabel + ", " + analysisTypes[iAnalysis];
            }
          }
        }
        compErrorExclamation.title = strErrorLabel;
      }
      else {
        //$componentElem.css("outline-style","none");
        //$compErrorExclamation.css("visible",false);
        compErrorExclamation.style.visibility = "hidden";
        componentGraphIcon.style.visibility = 'visible'
      }

      if (!(schemasList[iSchema] in isValidSchemas)) {
        // var schema_tab = document.getElementById("btn_" + [schemasList[iSchema]])
        // schema_tab.style.color = "white"
        // document.getElementById("erroImg_" + [schemasList[iSchema]]).style.display = "none"
        isValidSchemas[schemasList[iSchema]] = true;
      }
      if (isValid == false) {
        isValidSchemas[schemasList[iSchema]] = false;// isValidSchemas[schemasList[iSchema]] + 1;
      }
    } //fim do for de componente

    if (components.length == 0) {
      jsonAppStatus[schemasList[iSchema]]["isEmpty"] = true
      isValidSchemas[schemasList[iSchema]] = false
    }
    else
      jsonAppStatus[schemasList[iSchema]]["isEmpty"] = false

    if (isValidSchemas[schemasList[iSchema]] == false) {
      // var schema_tab = document.getElementById("btn_" + [schemasList[iSchema]])
      // document.getElementById("erroImg_" + [schemasList[iSchema]]).style.display = "block"
      // schema_tab.style.color = "red"
      schemasWithErrors.push([schemasList[iSchema]])
      isValidApplication = false;
    }
  } //fim do for de schemas  


  return [jsonAppStatus, isValidSchemas, isValidApplication, schemasWithErrors];
} // Fim da função checkApplication
