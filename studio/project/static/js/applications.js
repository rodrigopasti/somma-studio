/*
Funções de manipulação dos dados de aplicações. Arquivo applications.html
*/
var applicationsCount = 0;
var applicationsInfo = {};
var sharedApplicationsInfo = {};
var newApplicationInfo = {};
var clickedApplication = ""; //Aplicação corrente (selecionada)
markdownConverter = new showdown.Converter();
markdownFlag = false;

/*
Adiciona um novo request na tabela e ao JSON de requests
*/
function newApplication() {
  document.getElementById("application_info").style.display = 'block'

  document.getElementById("new_app_button_wrapper").style.display = 'block'
  document.getElementById("actions_buttons_wrapper").style.display = 'none'
  document.getElementById("input_application_create_date").value = ''

  do {
    applicationsCount = applicationsCount + 1;
    newApplicationName = "New Application " + applicationsCount;
  }
  while (newApplicationName in applicationsInfo)

  document.getElementById("input_application_name").value = newApplicationName
  document.getElementById("input_application_create_date").value = new Date().toJSON().slice(0, 10).split('-').reverse().join('/')

  //Adicionando ao JSON
  newApplicationInfo["application_name"] = document.getElementById("input_application_name").value;
  newApplicationInfo["creation_date"] = document.getElementById("input_application_create_date").value
  newApplicationInfo["author"] = "";
  newApplicationInfo["description"] = getReadmeTemplate();



  newApp = "true";
}

/*
Apaga uma aplicação
*/
function deleteApp() {
  if (confirm("Delete application?")) {
    deleteApplication(clickedApplication); //Função de appplicationsControl.js
    delete applicationsInfo[clickedApplication]
    clickedApplication = ""
  }
}

function deleteSharedApp(applicatioName) {
  if (confirm("Delete shared application?")) {
    deleteSharedApplication(applicatioName); //Função de appplicationsControl.js
    delete sharedApplicationsInfo[applicatioName]
  }
}

/*
Função que faz a interface para criar e abrir uma aplicação
Extrai do formulário as informações necessárias
*/
function createOpen() {
  newApplicationInfo["application_name"] = document.getElementById("input_application_name").value
  var idNames = Object.keys(componentsTemplates)
  var arr = [] //Array para armazenar todos os id_names para comparar com os nomes dos schemas
  for (var i = 0; i < idNames.length; i++) {
    arr.push(componentsTemplates[idNames[i]]["id_name"])
  }
  var nameExists = false
  const appNames = Object.keys(applicationsInfo)
  for (let name of appNames) {
    newApplicationInfo["application_name"]
    if (name == newApplicationInfo["application_name"]) {
      nameExists = true
    }
  }
  if (nameExists == false) {
    if (verifyStringSize("application_name", newApplicationInfo["application_name"]) && validateIntegrity(newApplicationInfo["application_name"]) && verifyIfContainsIdName(newApplicationInfo["application_name"], arr, "Application name")) {
      createOpenApplication(newApplicationInfo) //Função de applicationsControl


      applicationsInfo = getApplicationsInfo();
    }
  }
  else
    messagesLog("Application name duplicated")

}

/*
Função que faz a interface para abrir uma aplicação
*/
function openApp() {
  if (clickedApplication != applicationsInfo[clickedApplication]["application_name"]) {

    appInfo = applicationsInfo[clickedApplication]
    appInfo["application_name"] = clickedApplication

    document.getElementById("btn_open_app").disabled = true;
    document.getElementById("btn_delete_app").disabled = true;

    $.ajax({
      url: "/create-application",
      type: 'POST',
      processData: false,
      contentType: false,
      dataType: 'text',
      data: JSON.stringify(appInfo),
      success: function () {
        document.getElementById("btn_open_app").disabled = false;
        document.getElementById("btn_delete_app").disabled = false;
        document.getElementById("label_app_name").style.display = "inline-block"
        document.getElementById("label_app_name").textContent = appInfo["application_name"];
        openApplication(applicationsInfo[clickedApplication]) //Função de applicationsControl
      },
      error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr)
        document.getElementById("btn_open_app").disabled = false;
        document.getElementById("btn_delete_app").disabled = false;
        messagesLog(xhr.responseText)
        document.getElementById("screen-app-loader-app").style.display = "none"
      }
    });

  }
  else {
    openApplication(applicationsInfo[clickedApplication]) //Função de applicationsControl
    // document.getElementById("label_app_name").style.display = "inline-block"
    // document.getElementById("label_app_name").textContent = clickedApplication;
  }
}



/*
Renderiza nomes das aplicações
*/
function renderApplicationNames() {
  $("#applications_names tr").remove();
  applicationsCount = 0;
  var applicationsNamesTable = document.getElementById("applications_names");
  applicationsNames = Object.keys(applicationsInfo);
  var iName;
  for (iName = 0; iName < applicationsNames.length; iName++) {
    var trtag = document.createElement('tr'); //Row
    var tdtag = document.createElement('td'); //Cell
    trtag.appendChild(tdtag);
    var atag = document.createElement('a'); //Elemento
    atag.setAttribute("href", "#");
    atag.setAttribute("id", "app___" + applicationsNames[iName])
    atag.setAttribute("class", "link_applications");
    atag.setAttribute("title", applicationsNames[iName]); //Utiliza title para armazenar informação anterior
    atag.setAttribute("contenteditable", "false");
    //atag.setAttribute("onclick", "renderApplicationParameters('" + applicationsNames[iName] + "');");
    newApp = "false";
    atag.setAttribute("onclick", "renderApplicationParameters('" + applicationsNames[iName] + "','" + newApp + "');");
    //atag.onclick = function() { renderApplicationParameters('applicationsNames[iName]');};
    atag.innerHTML = applicationsNames[iName];
    tdtag.appendChild(atag);
    applicationsNamesTable.appendChild(trtag);
  }

}

function renderSharedApplicationNames() {
  sharedApplicationsInfo = getSharedApplicationsInfo();

  $("#shared_applications_names tr").remove();
  applicationsCount = 0;
  var applicationsNamesTable = document.getElementById("shared_applications_names");
  applicationsNames = Object.keys(sharedApplicationsInfo);
  var iName;
  for (iName = 0; iName < applicationsNames.length; iName++) {

    var trtag = document.createElement('tr'); //Row
    var tdtag = document.createElement('td'); //Cell
    trtag.appendChild(tdtag);
    var atag = document.createElement('a'); //Elemento
    atag.setAttribute("href", "#");
    atag.setAttribute("id", "app___" + applicationsNames[iName])
    atag.setAttribute("class", "link_applications");
    atag.setAttribute("title", applicationsNames[iName]); //Utiliza title para armazenar informação anterior
    atag.setAttribute("contenteditable", "false");
    //atag.setAttribute("onclick", "renderApplicationParameters('" + applicationsNames[iName] + "');");
    newApp = "false";
    var author = sharedApplicationsInfo[applicationsNames[iName]]["author"]
    atag.setAttribute("onclick", "renderSharedApplicationParameters('" + applicationsNames[iName] + "','" + newApp + "', '" + author + "');");
    //atag.onclick = function() { renderApplicationParameters('applicationsNames[iName]');};
    atag.innerHTML = applicationsNames[iName];
    tdtag.appendChild(atag);
    applicationsNamesTable.appendChild(trtag);
  }

}
/*-------------------------------*/



/* Alterna entre texto e markdown */

function renderMarkdown() {

  var checkBox = document.getElementById("checkbox_markdown");
  var text = document.getElementById("readme_area");
  var md = document.getElementById("readme_div");

  if (checkBox.checked) {
    md.innerHTML = markdownConverter.makeHtml(text.value.replace(/(?:\\r\\n|\\r|\\n)/g, '\n'))
    text.style.display = "none";
    md.style.display = "inline-block"
    //Atualizar JSON de definições das informações
    applicationsInfo[clickedApplication]["description"] = text.value;
    setApplicationsInfo(applicationsInfo); //De applications Control
  } else {
    text.style.display = "inline-block";
    md.style.display = "none"
  }
}

/*Insere a aplicação clonada na lista de aplicações do usuário */
function appendClonedApplication(clonedApp) {
  $.extend(applicationsInfo, clonedApp)
  var clonedApp = clonedApp[Object.keys(clonedApp)]
  clonedAppInfo = {
    "application_name": clonedApp["application_name"],
    "creation_date": clonedApp["creation_date"]
  }
  clonedAppInfo = JSON.stringify(clonedAppInfo)
  var applicationsNamesTable = document.getElementById("applications_names");
  var trtag = document.createElement('tr'); //Row
  var tdtag = document.createElement('td'); //Cell
  trtag.appendChild(tdtag);
  var atag = document.createElement('a'); //Elemento
  atag.setAttribute("href", "#");
  atag.setAttribute("id", "app___" + clonedApp["application_name"])
  atag.setAttribute("class", "link_applications");
  atag.setAttribute("title", clonedApp["application_name"]); //Utiliza title para armazenar informação anterior
  atag.setAttribute("contenteditable", "false");
  newApp = "false";
  atag.setAttribute("onclick", "renderApplicationParameters('" + clonedApp["application_name"] + "','" + newApp + "');");
  atag.innerHTML = clonedApp["application_name"];
  tdtag.appendChild(atag);
  applicationsNamesTable.appendChild(trtag);
}
/*
Renderiza todas as tabelas baseado na seleção da aplicação
*/
function renderApplicationParameters(applicationName, newApp) {
  clickedApplication = applicationName

  $("#application_parameters tr").remove();
  var parametersTable = document.getElementById("application_parameters");

  /*
  //Renderiza o máximo de parâmetros na primeira linha
  */
  var trtag = document.createElement('tr'); //Row
  var tdtag = document.createElement('td'); //Cell
  trtag.appendChild(tdtag);
  tdtag.setAttribute("id", "application_parameters_div")
  /*
  app name
  */
  var label = document.createElement('label');
  label.setAttribute("class", "app_param_label");
  label.innerHTML = "Application Name"

  //input
  var input = document.createElement('input');
  input.setAttribute("class", "app_param_input");
  input.setAttribute("id", "applicationName")
  input.setAttribute("type", "text");
  input.setAttribute("value", applicationName);
  input.setAttribute("maxlength", "25")
  input.setAttribute("name", "application_name"); //name recebe o nome do parametro (assim como label)
  tdtag.appendChild(label);
  tdtag.appendChild(input);


  /*
  creation_date
  */
  var label = document.createElement('label');
  label.setAttribute("class", "app_param_label");
  label.innerHTML = "Creation Date"
  //input
  var input = document.createElement('input');
  input.readOnly = true;
  input.setAttribute("class", "app_param_input");
  input.setAttribute("type", "text");
  input.style.width = "13%"
  if (newApp == "true") {
    input.setAttribute("value", new Date().toJSON().slice(0, 10).split('-').reverse().join('/'));
  }
  else {
    input.setAttribute("value", applicationsInfo[applicationName]["creation_date"]);
  }
  input.setAttribute("name", "creation_date"); //name recebe o nome do parametro (assim como label)
  tdtag.appendChild(label);
  tdtag.appendChild(input);

  /*
  author
  */

  /*

  var label = document.createElement('label');
  label.setAttribute("class", "options_labels");
  label.innerHTML = "author";
  //input
  var input = document.createElement('input');
  input.setAttribute("class", "app_param_input");
  input.setAttribute("type", "text");
  if (newApp == "true"){
    input.setAttribute("value", newApplicationInfo["author"]);
  }
  else{
    input.setAttribute("value", applicationsInfo[applicationName]["author"]);
  }
  input.setAttribute("name","author"); //name recebe o nome do parametro (assim como label)
  tdtag.appendChild(label);
  tdtag.appendChild(input);

  */

  var label = document.createElement('label');
  label.setAttribute("class", "app_param_label");
  label.innerHTML = "Readme";


  var swi = document.createElement('input');
  swi.setAttribute("id", "checkbox_markdown")
  swi.setAttribute("class", "")
  swi.setAttribute("type", "checkbox")
  swi.setAttribute("style", "width: 21px; height: 21px; top: 7px; position: relative;")
  swi.setAttribute("checked", true)
  swi.setAttribute("onclick", "renderMarkdown()");

  tdtag.appendChild(label);
  tdtag.append(swi)

  if (newApp == "true") {
    //Botão Create and Open
    var buttonOpen = document.createElement('button');
    buttonOpen.setAttribute("class", "button_applications");
    buttonOpen.setAttribute("style", "left: 2%;");
    //buttonOpen.setAttribute("style", "font-size: 10px; height: 21px;")
    buttonOpen.setAttribute("onclick", "createOpen();");
    buttonOpen.textContent = "Create and Open";
    buttonOpen.setAttribute("title", "Create and open a new application");
    tdtag.appendChild(buttonOpen);
  }
  else {
    //Botão open
    var buttonOpen = document.createElement('button');
    buttonOpen.setAttribute("class", "button_applications");
    //buttonOpen.setAttribute("style", "border: none; cursor: pointer; font-size: 10px; height: 35px; left: 2%; position: relative;")
    buttonOpen.setAttribute("style", "left: 2%;")
    buttonOpen.setAttribute("id", "btn_open_app")
    buttonOpen.setAttribute("onclick", "openApp();");
    buttonOpen.textContent = "Open";
    buttonOpen.setAttribute("title", "Open application");
    tdtag.appendChild(buttonOpen);


    //Botão save
    //var buttonSave = document.createElement('button');
    //buttonSave.setAttribute("class", "button_applications");
    //buttonSave.setAttribute("style", "left:9%;")
    //buttonSave.textContent = "Save";
    //tdtag.appendChild(buttonSave);


    //Botão save
    var buttonSave = document.createElement('button');
    buttonSave.setAttribute("class", "button_applications");
    //buttonSave.setAttribute("style", "font-size: 10px; height: 35px; left: 3%; position: relative;")
    buttonSave.setAttribute("style", "left: 3%;")
    buttonSave.setAttribute("onclick", "updateInfo('" + applicationName + "');");
    buttonSave.textContent = "Save";
    buttonSave.setAttribute("title", "Save information");
    tdtag.appendChild(buttonSave);


    //Botão delete
    var buttonDel = document.createElement('button');
    buttonDel.setAttribute("class", "button_applications");
    buttonDel.setAttribute("id", "btn_delete_app")
    buttonDel.setAttribute("style", "left: 4%;")
    //buttonDel.setAttribute("style", "font-size: 10px; height: 35px; left: 4%; position: relative;")
    buttonDel.setAttribute("onclick", "deleteApp('" + applicationName + "');");
    buttonDel.textContent = "Delete";
    buttonDel.setAttribute("title", "Delete application");
    tdtag.appendChild(buttonDel);

    var buttonShare = document.createElement('button')
    buttonShare.setAttribute("class", "button_applications");
    buttonShare.setAttribute("id", "btn_share_app");
    buttonShare.setAttribute("style", "left: 5%;")
    buttonShare.setAttribute("onclick", "shareApplication('" + applicationName + "');");
    buttonShare.textContent = "Share";
    buttonShare.setAttribute("title", "Share application");
    tdtag.appendChild(buttonShare)

  }

  //Adiciona à tabela
  //tdtag.appendChild(form);
  parametersTable.appendChild(trtag);

  /*
  Segunda linha (descrição)
  */
  var trtag = document.createElement('tr'); //Row
  trtag.setAttribute("class", "readme_tr")
  trtag.style.position = "fixed"
  trtag.style.top = "20.5%"
  trtag.style.width = "100%"
  trtag.style.height = "100%"
  var tdtag = document.createElement('td'); //Cell
  tdtag.style.width = "100%"
  trtag.appendChild(tdtag);
  //form
  //var form = document.createElement('form');
  /*
  var label = document.createElement('label');
  label.setAttribute("class", "options_labels");
  label.setAttribute("style", "position: relative; bottom: 175px; display: inline-block;")
  label.innerHTML = "README"
  */

  /*var slide = document.createElement('label');
  slide.setAttribute("id", "switch_slide_code")
  slide.setAttribute("class", "switch switch-slide")
  slide.setAttribute("style", "position: relative; display: block; left: 7%; top:0%;")

  var switchLabel = document.createElement('span');
  switchLabel.setAttribute("data-on", "Text")
  switchLabel.setAttribute("data-off", "Markdown")

  var switchHandle = document.createElement('span');
  switchHandle.setAttribute("class", "switch-handle")

  slide.appendChild(swi)
  slide.appendChild(switchLabel)
  slide.appendChild(switchHandle)

  */




  //input
  var input = document.createElement('textarea');
  input.setAttribute("id", "readme_area")
  input.setAttribute("rows", "2000")
  input.setAttribute("cols", "2000")
  input.setAttribute("spellcheck", "off")
  input.setAttribute("style", "resize: none; display: none; position: fixed; top: 20.5%; width: 78.5%; height: 63.1%; left: 18%; overflow-y: scroll;")

  var div = document.createElement('div');
  div.setAttribute("id", "readme_div")
  //OLD WAY>> div.setAttribute("style", "display: block; position: relative; width: 76.5%; height: 489px; left: 2%; overflow-y: scroll;")
  div.setAttribute("class", "readme_div")

  if (newApp == "true") {
    description = newApplicationInfo["description"]
    input.value = description
    div.innerHTML = markdownConverter.makeHtml(newApplicationInfo["description"])
  }
  else {
    description = applicationsInfo[applicationName]["description"].replace(/(?:\\r\\n|\\r|\\n)/g, '\n')
    input.value = description
    div.innerHTML = markdownConverter.makeHtml(description)
  }

  input.setAttribute("name", "description"); //name recebe o nome do parametro (assim como label)
  //tdtag.appendChild(label);
  tdtag.appendChild(div)
  tdtag.appendChild(input);
  //tdtag.appendChild(swi)

  //Adiciona à tabela
  //tdtag.appendChild(form);
  parametersTable.appendChild(trtag);

  /*
  Adiciona uma linha em branco
  */

  /*
  var trtag = document.createElement('tr'); //Row
  var tdtag = document.createElement('td'); //Cell
  tdtag.setAttribute("style", "height: 70px; text-align: right;")
  trtag.appendChild(tdtag);
  parametersTable.appendChild(trtag);
  */


}

function renderSharedApplicationParameters(applicationName, newApp, author) {
  var userEmail = document.getElementById("my_account_email").value
  sharedApplicationsInfo = getSharedApplicationsInfo();
  clickedApplication = applicationName;
  $("#shared_application_parameters tr").remove();
  var parametersTable = document.getElementById("shared_application_parameters");

  /*
  //Renderiza o máximo de parâmetros na primeira linha
  */

  /*
  app name
  */
  var trtag = document.createElement('tr'); //Row
  var tdtag = document.createElement('td'); //Cell
  trtag.appendChild(tdtag);
  tdtag.setAttribute("id", "application_parameters_div")
  /*
  Author name
  */
  if (author) {
    var label = document.createElement('label');
    label.setAttribute("class", "app_param_label");
    label.innerHTML = "Author"
    //input
    var input = document.createElement('input');
    input.setAttribute("class", "app_param_input");
    input.setAttribute("type", "text");
    input.setAttribute("value", author);
    input.setAttribute("maxlength", "23")
    input.readOnly = true
    input.setAttribute("name", "application_name"); //name recebe o nome do parametro (assim como label)
    tdtag.appendChild(label);
    tdtag.appendChild(input);
  }


  /*
  app name
  */
  var label = document.createElement('label');
  label.setAttribute("class", "app_param_label");
  label.innerHTML = "Application Name"
  //input
  var input = document.createElement('input');
  input.setAttribute("class", "app_param_input");
  input.setAttribute("type", "text");
  input.setAttribute("value", applicationName);
  input.setAttribute("maxlength", "23")
  input.setAttribute("name", "application_name"); //name recebe o nome do parametro (assim como label)
  tdtag.appendChild(label);
  tdtag.appendChild(input);

  /*
  creation_date
  */
  var label = document.createElement('label');
  label.setAttribute("class", "app_param_label");
  label.innerHTML = "Creation Date"
  //input
  var input = document.createElement('input');
  input.readOnly = true;
  input.setAttribute("class", "app_param_input");
  input.setAttribute("type", "text");
  input.style.width = "13%"
  if (newApp == "true") {
    input.setAttribute("value", new Date().toJSON().slice(0, 10).split('-').reverse().join('/'));
  }
  else {
    input.setAttribute("value", sharedApplicationsInfo[applicationName]["creation_date"]);
  }
  input.setAttribute("name", "creation_date"); //name recebe o nome do parametro (assim como label)
  tdtag.appendChild(label);
  tdtag.appendChild(input);

  //Botão open
  var buttonClone = document.createElement('button');
  buttonClone.setAttribute("class", "button_applications");
  //buttonOpen.setAttribute("style", "border: none; cursor: pointer; font-size: 10px; height: 35px; left: 2%; position: relative;")
  buttonClone.setAttribute("style", "left: 2%;")
  buttonClone.setAttribute("id", "btn_open_app")
  buttonClone.setAttribute("onclick", "cloneApplication('" + applicationName + "');");
  buttonClone.textContent = "Clone";
  buttonClone.setAttribute("title", "Clone application");
  tdtag.appendChild(buttonClone);

  var buttonCloneAndOpen = document.createElement('button');
  buttonCloneAndOpen.setAttribute("class", "button_applications");
  buttonCloneAndOpen.setAttribute("style", "left: 3%;")
  buttonCloneAndOpen.setAttribute("onclick", "cloneOpen('" + applicationName + "' );");
  buttonCloneAndOpen.textContent = "Clone and Open";
  buttonCloneAndOpen.setAttribute("title", "Clone and Open application");
  tdtag.appendChild(buttonCloneAndOpen);

  //Renderiza o botão delete apenas se o autor da aplicação for igual ao e-mail do usuário autenticado
  if (author == userEmail) {
    // Botão delete
    var buttonDel = document.createElement('button');
    buttonDel.setAttribute("class", "button_applications");
    buttonDel.setAttribute("id", "btn_delete_app")
    buttonDel.setAttribute("style", "left: 4%;")
    //buttonDel.setAttribute("style", "font-size: 10px; height: 35px; left: 4%; position: relative;")
    buttonDel.setAttribute("onclick", "deleteSharedApp('" + applicationName + "');");
    buttonDel.textContent = "Delete";
    buttonDel.setAttribute("title", "Delete application");
    tdtag.appendChild(buttonDel);
  }


  //Adiciona à tabela
  //tdtag.appendChild(form);
  parametersTable.appendChild(trtag);

  /*
  Segunda linha (descrição)
  */
  var trtag = document.createElement('tr'); //Row
  trtag.setAttribute("class", "readme_tr")
  trtag.style.position = "fixed"
  trtag.style.top = "20.5%"
  trtag.style.width = "100%"
  trtag.style.height = "100%"
  var tdtag = document.createElement('td'); //Cell
  tdtag.style.width = "100%"
  trtag.appendChild(tdtag);

  //input
  var input = document.createElement('textarea');
  input.setAttribute("id", "readme_area")
  input.setAttribute("rows", "2000")
  input.setAttribute("cols", "2000")
  input.setAttribute("spellcheck", "off")
  input.setAttribute("style", "resize: none; display: none; position: fixed; top: 20.5%; width: 78.5%; height: 63.1%; left: 18%; overflow-y: scroll;")

  var div = document.createElement('div');
  div.setAttribute("id", "readme_div")
  div.setAttribute("class", "readme_div")

  if (newApp == "true") {
    description = newApplicationInfo["description"]
    input.value = description
    div.innerHTML = markdownConverter.makeHtml(newApplicationInfo["description"])

  }
  else {
    description = sharedApplicationsInfo[applicationName]["description"].replace(/(?:\\r\\n|\\r|\\n)/g, '\n')
    input.value = description
    div.innerHTML = markdownConverter.makeHtml(description)
  }
  input.setAttribute("name", "description"); //name recebe o nome do parametro (assim como label)
  //tdtag.appendChild(label);
  tdtag.appendChild(div)
  tdtag.appendChild(input);
  //tdtag.appendChild(swi)

  //Adiciona à tabela
  //tdtag.appendChild(form);
  parametersTable.appendChild(trtag);

}


function refreshApplications() {
  readApplications(true)
  applicationsInfo = getApplicationsInfo();
  renderNamesTable("applications_names", applicationsInfo)
}

function refreshSharedApplications() {
  readSharedApplications(true)
  sharedApplicationsInfo = getSharedApplicationsInfo();
  handleDropdownOption(document.getElementById("shared_applications_option"), 'shared_applications')
}




/*-------------------------------*/

function getReadmeTemplate() {
  x = "##My SOMMA Application ![App](https://studio.somma.io/static/img/300px_logo_org.png)\
  \n##Table of Contents\
  \n- [Introduction](#introduction)\
  \n- [Features](#features)\
  \n- [Schemas](#schemas)\
  \n- [Data](#data)\
  \n## Introduction\
  \nThis application...\
  \n## Features\
  \nSome features...\
  \n## Schemas\
  \nDescribe the schemas...\
  \n##Data\
  \nDatasets, data objects and attributes used in this application."
  return x
}
