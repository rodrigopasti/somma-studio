var styleLayers = {};
styleLayers["color"] = "#fb8500";
styleLayers["color-grad"] = "#fb8500";
styleLayers["endpoint-color"] = "#000000";
styleLayers["line-color"] = "#000000";

var jsPlumbNNInstances = {}
var layerParameters = {}
var countLayers = 0;
var layersData = {}

var lastOpened; //Armazenará o último dropdown aberto

function createWindowNN(idNameComp, divIdIndexComp, panzoomInstances, appSchema, box, j) {

  idNameComp = idNameComp.replace(/\s/g, '')
  windowNN = document.createElement('div');
  windowNN.setAttribute("id", "window_nn_" + idNameComp + "-xx-" + divIdIndexComp);
  windowNN.addEventListener('click', function (event) {
    panzoomInstances[appSchema].pause();
    event.stopPropagation();
  });
  windowNN.style = 'width: 1200px; height: 700px; position: absolute;  display: none;' +
    'background: #4c4c4c; overflow-y: none; z-index: 5000;  -webkit-animation: fadein 0.2s; animation: fadein 0.2s;';
  //windowNN.setAttribute("onmousedown", "clearComponentsSelection()");


  var windowNNHeader = document.createElement('div');
  windowNNHeader.setAttribute("id", "window_nn_header_" + idNameComp + "-xx-" + divIdIndexComp);
  windowNNHeader.setAttribute("style", "display: block; z-index: 1; resize: none; overflow:none; background-color: #4c4c4c; position: absolute; height: 30px; width: 100%; top: 0px; right: 0px");
  windowNN.appendChild(windowNNHeader)

  //Cria botão de fechar do menu
  idCanvas = "canvas_nn_" + idNameComp + "-xx-" + divIdIndexComp;
  var menuCloseButton = document.createElement('img');
  menuCloseButton.setAttribute("id", "menu_close_" + idNameComp + "-xx-" + divIdIndexComp);
  menuCloseButton.setAttribute("onclick", "closeNeuralNetworkMenu('" + windowNN.id + "' ,'" + idCanvas + "','" + idNameComp + "','" + divIdIndexComp + "');");
  menuCloseButton.setAttribute("src", "../static/img/close_component_menu.png");
  menuCloseButton.style = 'cursor: pointer;  width: 21px; height: 21px; position: absolute; left: 0px; top: 0px;';
  menuCloseButton.title = "Close and save network";
  windowNNHeader.appendChild(menuCloseButton);

  //Cria div para canvas de Rede Neural
  canvasNN = document.createElement('div');
  canvasNN.setAttribute("id", idCanvas);
  canvasNN.addEventListener("click", function () {
    closeDropDownLayers();
  });
  canvasNN.style = 'background: white; border-width: 1px; border-color:#4c4c4c; border-style: solid; position: absolute; width: 100%; height: calc(100% - 30px); left: 0px; top: 30px;';
  windowNN.appendChild(canvasNN);

  //Cria menus
  createDropDownLayers(windowNNHeader, idCanvas);

  box.appendChild(windowNN);
  //divComponent.appendChild(windowNN)
  //Agregar instância do jsplumb
  jsPlumbNNInstances[idCanvas] = jsPlumb.getInstance({
    Container: idCanvas
  });

  dragOptions = {
    cancel: ("#" + idCanvas),
    containment: ("#box_item_" + appSchema)
  }
  $("#" + windowNN.id).draggable(dragOptions).resizable({ handles: 'all' });
  return idCanvas;
}



function renderOpenNNMenuButton(idName, divIdIndex, idCanvas) {

  var abrir = document.createElement('img');
  abrir.setAttribute("id", "open_menu_nn_div_" + idName + "-" + divIdIndex);
  idName = idName.replace(/\s/g, '')
  windowNNId = "window_nn_" + idName + "-xx-" + divIdIndex

  abrir.setAttribute("onclick", "openNeuralNetworkMenu('" + windowNNId + "' ,'" + idName + "' ,'" + divIdIndex + "' ,'" + idCanvas + "');");
  abrir.setAttribute("src", "../static/img/edit_component.png");
  abrir.title = "Open parameters";
  abrir.style = 'cursor: pointer; position: relative; top:0px; width: 23px; height: 23px;';
  return abrir
}

function openNeuralNetworkMenu(windowNNId, idNameComp, divIdIndexComp, idCanvas) {

  var wNN = document.getElementById(windowNNId);
  wNN.style.display = 'block';
  wNN.style.top = "100px";
  wNN.style.left = "100px";

  jsPlumbNNInstances[idCanvas].repaintEverything(); //Função de jsPlumb para corrigir posicionamento das connections

}

/*
Fecha a janela de edição das redes neurais
*/
function closeNeuralNetworkMenu(id, idCanvas, idName, divIdIndex) {
  document.getElementById(id).style.display = 'none';
}



function generateNN(jsonLayers, idCanvas) {
  countLayers = 0; //reinicia contagem
  layersInSchema = jsonLayers["layers"];
  nLayers = layersInSchema.length;

  //Gerar cada componente
  for (var i = 0; i < nLayers; i++) {
    try {
      layerIdName = layersInSchema[i]["parameters"]["id_name"];
      layerTypes = Object.keys(layersTemplate)
      for (iLayer = 0; iLayer < layerTypes.length; iLayer++) {
        if (Object.keys(layersTemplate[layerTypes[iLayer]]).includes(layerIdName)) {
          layerType = layerTypes[iLayer];
        }
      }
      createLayer(idCanvas, layerIdName, layerType, layersInSchema[i]);
    }
    catch{
      continue;
    }

  }
  //Renderiza as conexões
  connectionsInSchema = jsonLayers["connections"];
  nConnections = connectionsInSchema.length;
  /*
  https://stackoverflow.com/questions/37419562/jsplumb-choose-which-endpoint-to-connect-to-if-an-element-has-multiple-endpoints
  https://stackoverflow.com/questions/22244492/jsplumb-connect-use-existing-endpoints-instead-of-creating-new
  */
  jNN = jsPlumbNNInstances[idCanvas];
  for (var iConn = 0; iConn < nConnections; iConn++) {
    x = connectionsInSchema[iConn]["source_id"].split("-xx-")
    sourceNN = x[0] + "-xx-" + x[1] + "-xx-" + idCanvas.split("-xx-")[1] + "_0"
    x = connectionsInSchema[iConn]["target_id"].split("-xx-")
    targetNN = x[0] + "-xx-" + x[1] + "-xx-" + idCanvas.split("-xx-")[1] + "_1"
    //source = connectionsInSchema[iConn]["source_id"] + "_0";
    //target = connectionsInSchema[iConn]["target_id"] + "_1"; OLD
    jNN.connect({ uuids: [sourceNN, targetNN] });
  }

}

/*
FUNÇÕES RELATIVAS AO DROPDOWN DO RUN
*/


function createDropDownLayers(windowNNHeader, idCanvas) {
  layerTypes = Object.keys(layersTemplate)
  pos = 30;
  for (i = 0; i < layerTypes.length; i++) {
    //dropDownSize = "position: absolute; height: 0px; width: 120px; top: 0px; left: 30px";
    layers = Object.keys(layersTemplate[layerTypes[i]])

    maxSize = (30 * layers.length).toString() + "px";
    posStr = pos.toString() + "px";

    //Cria botão de abrir menu de layers
    var menuLayerButton = document.createElement('a');
    menuLayerButton.innerHTML = layerTypes[i];
    menuLayerButton.setAttribute("id", "menu_layer_btn " + layerTypes[i])
    menuLayerButton.setAttribute("onclick", "openCloseDropDownLayers('" + layerTypes[i] + "' , '" + windowNNHeader.id + "', '" + maxSize + "')");

    if (i == 0)
      menuLayerButton.setAttribute("class", "dropwdown_nn dropwdown_nn_first")
    else
      menuLayerButton.setAttribute("class", "dropwdown_nn")

    //Cria dropDown
    var dropDown = document.createElement('div');
    dropDown.setAttribute("id", "dd_" + layerTypes[i] + "_" + windowNNHeader.id);
    dropDown.setAttribute("class", "dropdown_run_nn");
    dropDown.setAttribute("style", " height: 0px; width: 150px; top: 30px;");

    menuLayerButton.appendChild(dropDown);
    windowNNHeader.appendChild(menuLayerButton);
    //Coloca elementos
    nEntries = 0
    for (iLayer = 0; iLayer < layers.length; iLayer++) {
      nEntries = nEntries + 1;
      var option = document.createElement('a');
      option.innerHTML = layers[iLayer];
      //option.setAttribute("title", "");
      option.setAttribute("class", "ddoption_" + layers[iLayer] + "_" + windowNNHeader.id);
      option.setAttribute("style", "position: relative;  width:100%;  display: block; color: white; font-size: 12px; text-align: left");
      option.setAttribute("href", "#");
      dropDown.appendChild(option);
      layerData = null;
      option.setAttribute("onclick", "createLayer('" + idCanvas + "', '" + layers[iLayer] + "', '" + layerTypes[i] + "', '" + layerData + "')");
    }
    pos = pos + 150;

  }

}


function openCloseDropDownLayers(layerType, windowNNHeaderId, maxSize) {

  if (lastOpened && document.getElementById("dd_" + layerType + "_" + windowNNHeaderId) != lastOpened) {
    lastOpened.style.height = "0px"
  }
  if (document.getElementById("dd_" + layerType + "_" + windowNNHeaderId).style.height == "0px") {
    document.getElementById("dd_" + layerType + "_" + windowNNHeaderId).style.height = maxSize;
    lastOpened = document.getElementById("dd_" + layerType + "_" + windowNNHeaderId);
  }
  else {
    document.getElementById("dd_" + layerType + "_" + windowNNHeaderId).style.height = "0px";
    //var menuTextElements = document.getElementsByClassName("ddoption_" + type + "_" + schemaName)
    //for (var i = 0; i < menuTextElements.length; i++) {
    //  menuTextElements[i].style.display = "none";
    //}
  }
}



function closeDropDownLayers() {
  if (lastOpened) {
    lastOpened.style.height = "0px"
  }
  //Fecha somente se não for clicado em uma opção do menu
  //if(evt["relatedTarget"]["className"].startsWith("ddoption")==false){
  // openedMenu.style.height = "0px";
  //var menuTextElements = document.getElementsByClassName("dd_" + layerType + "_" + windowNNHeaderId)
  //for (var i = 0; i < menuTextElements.length; i++) {
  //  menuTextElements[i].style.display = "none";
  //}
  //}
}




/*
Apaga um layer através do ID de sua div
*/
function removeLayer(menuComponentId, divId, idCanvas) {
  jsPlumbCanvas = jsPlumbNNInstances[idCanvas]
  //j.removeAllEndpoints(divId)
  jsPlumbCanvas.remove(divId);
  jsPlumbCanvas.remove(menuComponentId);
}

/*
Cria um layer novo
*/
function createLayer(idCanvas, layerIdName, layerType, layerData) {

  newLayer = false;
  if (layerData == "null") {
    newLayer = true;
  }
  jsPlumbCanvas = jsPlumbNNInstances[idCanvas];
  countLayers++;
  var idName = layerIdName;
  if (newLayer == true) {
    var divIdIndex = countLayers.toString();
    compLeft = 140;
    compTop = 140;
  }
  else {
    var divIdIndex = layerData["div_id"].split("-xx-")[1];
    compLeft = layerData["position_left"];
    compTop = layerData["position_top"];
  }

  layerTemplate = layersTemplate[layerType][idName]

  styleComp = {}
  //nativeComponents é variável de applicationsControl
  styleComp = styleLayers;

  //layerParameters = componentData["parameters"];

  //componentsTemplates = getComponentsTemplates(); //Pegando JSON lido
  //Template do componente atual
  //componentTemplate = componentsTemplates[idName]
  /*
  Criando DIV principal do componente
  */
  var box = document.getElementById(idCanvas);

  // console.log(box);

  var div = document.createElement('div');
  //Armazenar do componente: name, id_name, e div id
  div.setAttribute("class", "layer-" + idCanvas.split("-xx-")[1]);
  div.setAttribute("id", idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);

  //div.setAttribute("style", "font-size:11px; width: 70px; height: 70px; padding: 0%; position: absolute; background-color:" + styleComp["color"] + "; float: left; color: white; text-align: center; border-radius: 7px; left:" + componentData["position_left"].toString() + "px ; top:" + componentData["position_top"].toString() + "px;");
  div.setAttribute("style", "font-size:11px; width: 70px; height: 50px; padding: 0%; position: absolute; background: linear-gradient(" + styleComp["color-grad"] + "," + styleComp["color"] + "); float: left; color: white; text-align: center; border-radius: 5px; left:" + compLeft.toString() + "px ; top:" + compTop.toString() + "px;");
  //div.setAttribute("onmousedown", "selectComponent(event,'" + div.id + "' ,'" + appSchema + "');");


  /*
  Criando menu de parâmetros (DIV)
  */
  divinsideNN = document.createElement('div');
  divinsideNN.setAttribute("id", "menu_" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);
  divinsideNN.style = 'width: 489px; height: 280px;  border-radius: 7px 7px 0px 7px; position: absolute;  display: none;' +
    'background: linear-gradient(#f2f2f2, #dddddd); overflow-y: auto; z-index: 5000;  -webkit-animation: fadein 0.2s; animation: fadein 0.2s;';
  //divinsideNN.setAttribute("onmousedown", "clearComponentsSelection()");
  div.setAttribute("ondblclick", "openParametersMenu('" + divinsideNN.id + "' ,'" + div.id + "');");

  box.appendChild(divinsideNN);
  box.appendChild(div);
  //Cria botão de fechar do menu
  var menuCloseButton = document.createElement('img');
  menuCloseButton.setAttribute("id", "menu_close_" + idName + "-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);
  menuCloseButton.setAttribute("onclick", "closeComponentMenu('" + divinsideNN.id + "');");
  menuCloseButton.setAttribute("src", "../static/img/close_component_menu.png");
  menuCloseButton.style = 'cursor: pointer; width: 21px; height: 21px; position: absolute; left: 0px; top: 0px;';
  menuCloseButton.title = "Close and keep parameters";
  divinsideNN.appendChild(menuCloseButton);

  //tag com nome do componente
  var ptag = document.createElement('p');
  //ptag.setAttribute("style", "cursor: context-menu; position: absolute; top: 10px;");
  //ptag.setAttribute("style", "cursor: context-menu;");
  ptag.innerHTML = idName.toString();
  div.appendChild(ptag);

  /*
  Elemento que abre menu de parâmetros
  */
  //var abrir = document.createElement('img');
  //abrir.setAttribute("class", "open_menu_div_" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);
  //abrir.setAttribute("onclick", "openComponentMenu('" + divinsideNN.id + "' ,'" + div.id + "' ,'" + JSON.stringify(layerParameters) + "');");
  //abrir.setAttribute("src", "../static/img/edit_component.png");
  //abrir.title = "Open parameters";
  //abrir.style = 'cursor: pointer; position: absolute; left: 3px; top: 47px; width: 21px; height: 21px;';
  //div.appendChild(abrir);


  /*
  Elemento que remove componente
  */
  var closeElement = document.createElement('img');
  closeElement.setAttribute("id", "remove_component_div_" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);
  closeElement.setAttribute("onclick", "removeLayer('" + divinsideNN.id + "' ,'" + div.id + "' ,'" + idCanvas + "');");
  closeElement.setAttribute("src", "../static/img/delete.png");
  closeElement.title = "Delete layer";
  closeElement.style = 'cursor: pointer;  position: absolute; left: -10px; top: -13px; width: 12px; height: 12px;';
  div.appendChild(closeElement);


  //Adicionando o form de parâmetros
  if (newLayer == true) {
    layerParameters = {};
  }
  else {
    layerParameters = layerData["parameters"];
  }

  form = createFormLayerParameters(layerTemplate, layerParameters, idName, divIdIndex, idCanvas);

  divinsideNN.appendChild(form);



  /*
  Criando elemento do JSPLUMP
  */
  jsPlumbCanvas.Defaults.Overlays = [
    ["Arrow", {
      location: 1,
      id: "arrow",
      length: 15,
      foldback: 0.8
    }]
  ];
  jsPlumbCanvas.ready(function () {
    var common = {
      //isSource: true,
      //isTarget: true,
      connector: ['Flowchart', { stub: [10, 10], gap: 7, cornerRadius: 15, alwaysRespectStubs: true }],
      endpoint: "Dot",
      maxConnections: 10,
      paintStyle: { lineWidth: 0.5 },
      connectorStyle: { outlineStroke: styleComp["line-color"], strokeWidth: 0, outlineWidth: 1 },
      endpointStyle: { fill: styleComp["endpoint-color"], radius: 7, outlineStroke: styleComp["endpoint-color"], outlineWidth: 1 },
    }
    //if(componentTemplate["component_type"]!="output"){
    jsPlumbCanvas.addEndpoint(div.id, {
      anchor: "Right",
      isSource: true,
      isTarget: false,
      uuid: idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1] + "_0",
    }, common);
    //}
    //if(componentTemplate["component_type"]!="input"){
    jsPlumbCanvas.addEndpoint(div.id, {
      anchor: "Left",
      isSource: false,
      isTarget: true,
      uuid: idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1] + "_1",
    }, common);
    //}
    jsPlumbCanvas.draggable(div.id, { containment: "parent" });
  });

  /*
  Criando elemento do JSPLUMP para janela de componente
  */
  //jsPlumbCanvas.ready(function () {
  //  jsPlumbCanvas.draggable(divinsideNN.id, { containment: "parent" });
  //});
}


function createFormLayerParameters(layerTemplate, layerParameters, idName, divIdIndex, idCanvas) {

  //Object.keys(layerParameters)
  newLayer = false;
  if (Object.keys(layerParameters).length == 0) {
    newLayer = true;
    //layerTemplate = layerParameters;
  }
  //Cria formulário que é inserido no menu
  form = document.createElement("form");
  form.setAttribute("id", "parameters_form_" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);
  form.setAttribute("style", "overflow-x: hidden;")
  var title = document.createElement("p");
  title.innerHTML = idName;
  title.style = "color: black; text-align: center; font-size: 12px";
  form.appendChild(title);

  listParameters = document.createElement("ul");
  listParameters.setAttribute("style", "text-align: left; display: block;");
  listParameters.setAttribute("id", "listParameters" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]);


  nFormEntries = 0;
  for (var parameter in layerTemplate) {
    var elementList = document.createElement("li");
    if (newLayer == true) {
      var value = layerTemplate[parameter];
    }
    else {
      var value = layerParameters[parameter];
    }
    templateValue = layerTemplate[parameter];

    var label = document.createElement("label");
    label.setAttribute("class", "param_label");
    label.setAttribute("style", "color: white; background-color: #4c4c49;");
    label.innerHTML = parameter;
    elementList.appendChild(label);

    valueType = typeof templateValue
    isArray = templateValue instanceof Array
    if (typeof value == "undefined") {
      value = "";
    }
    x = false;

    if ("select" in layerTemplate[parameter]) {
      var input = document.createElement("select");
      input.setAttribute("name", parameter); //name recebe o nome do parametro (assim como label)
      input.setAttribute("id", idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1] + "-xx-" + parameter)
      input.setAttribute("class", "param_select");
      //input.value = value;


      if ("help" in templateValue) {
        input.setAttribute("title", templateValue["help"]);
      }

      templateValue["select"].forEach(function (item) {
        var option = document.createElement("option");
        option.text = item;
        option.value = item;
        if (newComp == false && item == value) {
          option.selected = "true"
        }
        input.appendChild(option);
      });
      commonRender = false;
    }

    else if ("text" in layerTemplate[parameter] || "textlist" in layerTemplate[parameter]) {
      var input = document.createElement("input");
      input.setAttribute("type", "text");
      if (newLayer == true) {
        if ("text" in templateValue) {
          valueToRender = value["text"]
        }
        else {
          valueToRender = value["textlist"]
        }
      }
      else {
        valueToRender = value
      }

      input.setAttribute("value", JSON.stringify(valueToRender).replace(/"/g, ''));
      input.setAttribute("name", parameter); //name recebe o nome do parametro (assim como label)
      input.setAttribute("class", "param_input");
      input.setAttribute("size", "50");
    }
    else {
      var input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("value", JSON.stringify(value).replace(/"/g, ''));

      //input.setAttribute("value", value);
      input.setAttribute("name", parameter); //name recebe o nome do parametro (assim como label)
      input.setAttribute("class", "param_input");
      input.setAttribute("size", "50");
    }
    if (parameter == "id_name") {
      input.setAttribute("disabled", "true");
    }

    elementList.appendChild(input);
    listParameters.appendChild(elementList);

    nFormEntries = nFormEntries + 1;
  }
  form.appendChild(listParameters);
  extraSize = 0;
  if (nFormEntries <= 4) {
    extraSize = 45;
  }
  form.style.height = (nFormEntries * 49 + extraSize).toString() + "px";
  //document.getElementById("menu_" + idName + "-xx-" + divIdIndex).style.width = "560px";

  return form;
}


function openParametersMenu(id, idComp) {
  var menuLayer = document.getElementById(id);
  var layer = document.getElementById(idComp);

  menuLayer.style.display = 'block';
  //Ajuste para setar o top e o left do elemento do menu para ficar em cima do closeButton do Layer.
  var top = layer.style.top.split("px")[0]
  var left = layer.style.left.split("px")[0]

  top = Number(top) - 20
  left = Number(left) - 20

  menuLayer.style.top = top + "px";
  menuLayer.style.left = left + "px";

}


/*
Converte components e ligações em JSON e envia para uma rota do flask
*/
function updateLayersSchema(idCanvas, idName, divIdIndex) {
  //Inicializando JSON
  //EX: jsonLayersSchemas = {"schema_sentiment": {"components":[...], "connections": [...], "numberOfComponents": 2 } , "schema_collect": flowChart}
  jsonLayersSchemas = {};

  jsonLayersSchemas["layers"] = [];
  jsonLayersSchemas["connections"] = [];

  //Variável para armazenar correspondecia de div id para nome
  idToNameNN = {}
  //componentsTemplates = getComponentsTemplates();

  /*
  Capturar nós (componentes) e suas informações (segmentado por Schema)
  */
  layerClass = ".layer-" + idCanvas.split("-xx-")[1];
  $(layerClass).each(function (idx, elem) {
    isValid = true;
    var $elem = $(elem);
    /*
    Serializando informações do formulário
    */
    currentLayer = $elem.attr('id').split("-xx-")[0];
    layerTypes = Object.keys(layersTemplate)
    for (i = 0; i < layerTypes.length; i++) {
      if (currentLayer in layersTemplate[layerTypes[i]]) {
        layerType = layerTypes[i];
      }
    }

    parametersTemplateNN = layersTemplate[layerType][currentLayer];
    form = document.getElementById('parameters_form_' + $elem.attr('id'));
    //Para cada parametro do template fazer a busca pelo id
    parametersList = Object.keys(parametersTemplateNN)


    /*
    Para cada parâmetro, fazer a captura de valores nos elementos HTML e colocar
    em um JSON de parâmetros
    */
    parameters = {}

    for (var iParam = 0; iParam < parametersList.length; iParam++) {

      parameterElement = form.querySelector('[name="' + parametersList[iParam] + '"]');

      //if (typeof componentsTemplates[currentComp][parametersList[iParam]]=="object"){
      parameters[parameterElement.name] = parameterElement.value;
      //}
    } //Fim do for de parâmetros

    /*
    Adicionando informações sobre o elemento do layer
    */

    jsonLayersSchemas["layers"].push({
      div_id: $elem.attr('id'),
      position_left: parseInt($elem.css("left"), 10),
      position_top: parseInt($elem.css("top"), 10),
      parameters: parameters
    });
    idToNameNN[$elem.attr('id')] = parameters["name"];

  });


  /*
  Capturar arestas (conexões) e suas informações (segmentado por Schema)
  */
  $.each(jsPlumbNNInstances[idCanvas].getConnections(), function (idx, connection) {
    //connLabel = connection.getOverlay("label").label.split("-")
    jsonLayersSchemas["connections"].push({
      connection_id: connection.id,
      source_id: connection.sourceId,
      target_id: connection.targetId,
      source_name: idToNameNN[connection.sourceId],
      target_name: idToNameNN[connection.targetId],
      //connection_index_source: connLabel[0],
      //connection_index_target: connLabel[1]
      //connection_index: connection.getOverlay("label").label
    });
  });

  jsonLayersSchemaStr = JSON.stringify(jsonLayersSchemas);
  document.getElementById("nn_schema_" + idName + "-xx-" + divIdIndex + "-xx-" + idCanvas.split("-xx-")[1]).value = jsonLayersSchemaStr

  return jsonLayersSchemaStr;

}
