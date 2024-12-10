/*
Funções de manipulação de application run. Arquivo run.html
Observações importantes:
(1) A variável schemaName guarda o nome do schema quando carregado para criar
    os elementos HTML e controle.
(2) A variável selectedSchema salva o schema corrente selecionado para rodar
    obtido diretamente do label do nome do schema. Toda função de controle,
    quando chamada consulta o selectedSchema corrente a partir do schemaName
    que o acionou. Isso garante a consistência de quem está sendo chamado
*/
var progress = null;
var nReadLines = 0;
var endAppFlag = {};
var runningApp = {};
var selectedSchema = {};
var schemasExecutionID = {};
var requests_count = {};
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var currentFocusedDivId = "";
/* var lastComponent = ""
var componentStatus = "success"
var currentComponent = "" */

var lastComponent = {};
var componentStatus = {};
var currentComponent = {};

var componentsWithLog = [
    "Print Data",
    "Simple Graphs",
    "Geo Plot",
    "Count Data Objects",
];

/*

/*
Cria o menu de run do schema
*/

function setFocus(isRedo, elementId, schemaName) {
    if (currentFocusedDivId == "") {
        var currentzIndex = parseInt(
            document.getElementById(elementId).style.zIndex
        );
        document.getElementById(elementId).style.zIndex = currentzIndex + 1;
    }

    if (document.getElementById(currentFocusedDivId)) {
        var zIndex = parseInt(
            document.getElementById(currentFocusedDivId).style.zIndex
        );
        if (isRedo == true) {
            document.getElementById(elementId) == null
                ? (elementId = schemasAliases[elementId])
                : null;
        }
        document.getElementById(currentFocusedDivId).style.zIndex = zIndex - 1;
        document.getElementById(elementId).style.zIndex = zIndex + 1;
    }

    document.getElementById(elementId) == null
        ? (elementId = schemasAliases[elementId])
        : null;
    currentFocusedDivId = elementId;

    document.getElementById(elementId).focus();

    if (schemaName) panzoomInstances[schemaName].pause();
}

function createRunMenu(schemaName) {
    var divSchema = document.getElementById(schemaName);

    //Ids dos menus: Request Run e Run
    divRequestRunMenuId = "request_run_menu_" + schemaName;
    divRunMenuId = "run_schema_menu_" + schemaName;

    //Primeiro botão a ser criado é o que abre o menu, o qual tem um menu proprio
    //(uma div separada)
    divRequestRunMenu = document.createElement("div");
    divRequestRunMenu.setAttribute("id", divRequestRunMenuId);
    divRequestRunMenu.setAttribute(
        "style",
        "opacity: 0.9; width: 100px; height: 50px; background-color: white; display: block; position: absolute; z-index: 10; left: 110px; top: 30px; -webkit-animation: fadein 0.5s; animation: fadein 0.5s;"
    );

    //Botão de save para todos os schemas
    f = "saveApplication('" + schemaName + "')";
    fileName = "save_application_icon.svg";
    title = "Save Application";
    customStyle = "margin-left: 10px;";
    buttonElem = createButton(
        "save_app_" + schemaName,
        f,
        fileName,
        title,
        customStyle
    );
    divRequestRunMenu.appendChild(buttonElem);

    //Botão que abre menu de Run
    f = "openCloseRunSchemaMenu('" + schemaName + "')";
    fileName = "open_run_menu_icon.svg";
    title = "Open Run";
    customStyle = "top: 16px;";
    buttonElem = createButton(
        "button_menu_run_" + schemaName,
        f,
        fileName,
        title,
        customStyle
    );
    divRequestRunMenu.appendChild(buttonElem);
    //append no schema
    divSchema.appendChild(divRequestRunMenu);

    divRunMenu = document.createElement("div");
    divRunMenu.setAttribute("id", divRunMenuId);
    divRunMenu.setAttribute(
        "style",
        "opacity: 0.9; width: max-content; height: 50px; background-color: white; display: none; position: absolute; z-index: 11; left: 209px; top: 30px; -webkit-animation: fadein 0.5s; animation: fadein 0.5s;"
    );

    /*
    Botões do menu Run
    */

    //Run
    customStyle = "margin-left: 5px;";
    f = "runApplication('" + schemaName + "')";
    fileName = "run_application_icon.svg";
    title = "Run Application";
    // customStyle = "margin-left: 5px;";
    buttonElem = createButton("run_" + schemaName, f, fileName, title, customStyle);
    divRunMenu.appendChild(buttonElem);

    //Stop >>> Somente este botão começa desligado
    f = "stopApplication('" + schemaName + "')";
    fileName = "stop_application_icon.svg";
    title = "Stop Application";
    customStyle = "opacity: 0.1;";
    buttonElem = createButton(
        "stop_" + schemaName,
        f,
        fileName,
        title,
        customStyle
    );
    divRunMenu.appendChild(buttonElem);
    $(buttonElem).css("pointer-events", "none");
    //Logs
    f = "openCloseLogWindow('" + schemaName + "')";
    fileName = "open_log_window_icon.svg";
    title = "Logger";
    buttonElem = createButton(
        "log_" + schemaName.replace(/\s/g, "").trim(),
        f,
        fileName,
        title
    );
    divRunMenu.appendChild(buttonElem);

    /*
    Os com submenus (ou combobox)
    */

    //Dropdown de states
    type = "state";
    dropDownSize =
        "display: none; width: 140px; top: 50px; border-radius: 13px; left: 125px";
    var upArrowState = document.createElement("img");
    upArrowState.setAttribute("id", "dropdown_state_arrow_" + schemaName);
    upArrowState.setAttribute(
        "src",
        "../../static/icons/left_arrow_comp_menu.svg"
    );
    upArrowState.setAttribute("class", "dropdown-run-uparrow");
    dropDown = createDropDown(schemaName, "state", dropDownSize);
    dropDown.appendChild(upArrowState)[dropDown] = renderDropDownState(
        dropDown,
        schemaName
    );

    divRunMenu.appendChild(dropDown);
    //States
    f = "openCloseDropDownRun('" + schemaName + "' , 'state')";
    fileName = "application_state_icon.svg";
    title = "Appplication State";
    customStyle = "top: 13px;";
    buttonElem = createButton(
        "state_" + schemaName,
        f,
        fileName,
        title,
        customStyle
    );
    divRunMenu.appendChild(buttonElem);
    buttonElem.setAttribute(
        "onfocusout",
        "closeDropDownRun(event,'" + schemaName + "' , '" + type + "')"
    );
    //buttonElem.setAttribute("onmouseleave", "closeDropDownRun(event,'" + schemaName + "' , '" + type + "' , '" + maxSize +"')");
    //Adicionando o label da seleção

    var labelSelection = document.createElement("label");
    labelSelection.setAttribute("id", "ddl_" + type + "_" + schemaName);
    labelSelection.setAttribute("class", "run_label");
    labelSelection.innerHTML = "apply";
    labelSelection.setAttribute(
        "style",
        "font-size: 12px; top: -4px; left: -20px; padding: unset;"
    );
    divRunMenu.appendChild(labelSelection);

    //Dropdown de planos
    type = "plan";
    dropDownSize =
        "width: max-content; display: none; top: 50px; left: 210px; border-radius: 13px; background-color: #212121;";

    dropDown = createDropDown(schemaName, "plan", dropDownSize);

    [dropDown, defaulValue] = renderDropDownPlan(dropDown, schemaName);

    var upArrowPlan = document.createElement("img");
    upArrowPlan.setAttribute("id", "dropdown_plan_arrow_" + schemaName);
    upArrowPlan.setAttribute(
        "src",
        "../../static/icons/left_arrow_comp_menu.svg"
    );
    upArrowPlan.setAttribute("class", "dropdown-run-uparrow");
    upArrowPlan.setAttribute("style", "left: 15px;");

    dropDown.prepend(upArrowPlan);
    divRunMenu.appendChild(dropDown);

    //Plan
    f = "openCloseDropDownRun('" + schemaName + "' , 'plan')";
    fileName = "server_selection_icon.svg";
    title = "Execution Plans";
    customStyle = "top: 7px;";
    buttonElem = createButton(
        "plan_" + schemaName,
        f,
        fileName,
        title,
        customStyle
    );
    divRunMenu.appendChild(buttonElem);
    buttonElem.setAttribute(
        "onfocusout",
        "closeDropDownRun(event,'" + schemaName + "' , '" + type + "')"
    );
    //Adicionando o label da seleção
    var labelWrapper = document.createElement("div");
    labelWrapper.setAttribute("style", "display: inline; position: relative;");

    // var statusDiv = document.createElement("div")
    // statusDiv.setAttribute("id", "label_server_status_icon")

    var labelSelection = document.createElement("label");
    labelSelection.setAttribute("id", "ddl_" + type + "_" + schemaName);
    labelSelection.innerHTML = defaulValue;

    labelSelection.setAttribute(
        "style",
        "font-size: 12px; height: 25px; margin: 0; padding: unset; position: relative; left: -12px; top: -3px;"
    );
    labelWrapper.appendChild(labelSelection);
    divRunMenu.appendChild(labelWrapper);

    //Adicionando spinner de running (loader)
    var runningSpinner = document.createElement("div");
    runningSpinner.setAttribute("id", "running_" + schemaName);
    runningSpinner.setAttribute("class", "running_spinner");
    var div1 = document.createElement("div");
    runningSpinner.appendChild(div1);
    var div2 = document.createElement("div");
    runningSpinner.appendChild(div2);
    var div3 = document.createElement("div");
    runningSpinner.appendChild(div3);
    var div4 = document.createElement("div");
    runningSpinner.appendChild(div4);
    divRunMenu.appendChild(runningSpinner);

    //Append final da div de run
    divSchema.appendChild(divRunMenu);
    //Por fim, a janela de logs

   
    
    var logWindow = document.createElement("div");
    var trimmedSchemaName = schemaName.replace(/\s/g, "").trim();

    logWindow.setAttribute("id", "log_window_" + trimmedSchemaName);

    logWindow.setAttribute(
        "style",
        "display: none; z-index: 100; resize: none; overflow:none; background-color: black; position: absolute; height: 500px; width: 400px; top: 45px; right: 0px; -webkit-animation: fadein 0.2s; animation: fadein 0.2s;"
    );
    logWindow.setAttribute(
        "onmousedown",
        "setFocus('false', '" +
            "log_window_" +
            trimmedSchemaName +
            "' ,'" +
            schemaName +
            "');"
    );
    var logWindowHeader = document.createElement("div");
    logWindowHeader.setAttribute(
        "id",
        "log_window_header_" + trimmedSchemaName
    );
    logWindowHeader.setAttribute(
        "style",
        "display: block; z-index: 1; resize: none; overflow:none; background-color: #4c4c4c; position: absolute; height: 30px; width: 100%; top: 0px; right: 0px"
    );

    var closeWindow = document.createElement("span");
    closeWindow.setAttribute("id", "log_window_close_" + trimmedSchemaName);
    closeWindow.setAttribute("class", "log_window_close");
    closeWindow.setAttribute(
        "onclick",
        "closeLogWindow('" + trimmedSchemaName + "')"
    );
    closeWindow.innerHTML = "&times";
    logWindowHeader.appendChild(closeWindow);
    //Text area de logs
    var progressTextarea = document.createElement("div");
    progressTextarea.setAttribute(
        "id",
        "progress_textarea_" + trimmedSchemaName
    );
    progressTextarea.setAttribute("rows", "5000");
    progressTextarea.setAttribute("cols", "100");
    progressTextarea.setAttribute("spellcheck", "false");
    progressTextarea.setAttribute("readonly", "true");
    progressTextarea.setAttribute("contenteditable", "false");
    progressTextarea.setAttribute("overflow", "scroll");
    progressTextarea.setAttribute(
        "style",
        "border: none; font-size:14px; resize: none; left: 0%; top:10%; height: 90%; width: 100%; position: relative; display: block; background-color: black; color: white;"
    );

    var table = document.createElement("table");
    table.setAttribute("id", "logger_table_" + trimmedSchemaName);
    table.setAttribute(
        "style",
        "display:block; height:100%; width:100%; overflow-y:auto;"
    );
    table.setAttribute("class", "app_analysis_table");
    progressTextarea.appendChild(table);

    logWindow.appendChild(logWindowHeader);
    logWindow.appendChild(progressTextarea);
    divSchema.appendChild(logWindow);

    //Tornando a janela draggable e resizable
    dragOptions = {
        cancel: "#logger_table_" + trimmedSchemaName,
        drag: function (event, ui) {
            var mainPageWidth =
                document.getElementById("main-page").clientWidth;
            var logWindowWidth = document.getElementById(
                "log_window_" + trimmedSchemaName
            ).clientWidth;
            var mainPageHeight =
                document.getElementById("main-page").clientHeight;

            if (ui.position.top <= 30) {
                ui.position.top = 31;
            } else if (ui.position.left > mainPageWidth - 50) {
                ui.position.left = mainPageWidth - 50;
            } else if (ui.position.left <= -Math.abs(logWindowWidth) + 30) {
                ui.position.left = -Math.abs(logWindowWidth) + 30;
            } else if (ui.position.top >= mainPageHeight - 60) {
                ui.position.top = mainPageHeight - 60;
            }
        },
        // containment: ("#main-page")
    };
    $("#" + logWindow.id)
        .draggable(dragOptions)
        .resizable({ handles: "all" });
}

/*
Cria um botão do menu de run de schemas
*/
function createButton(divId, f, fileName, title, customStyle) {
    var imgUrl = "url('" + "../../static/icons/" + fileName + "')";
    buttonElem = document.createElement("a");
    buttonElem.setAttribute("id", divId);
    buttonElem.setAttribute("href", "#");
    buttonElem.setAttribute("onclick", f);
    buttonElem.setAttribute("title", title);
    buttonElem.setAttribute("draggable", "false");
    buttonElem.setAttribute("class", "run-menu-buttons");
    customStyle ? buttonElem.setAttribute("style", customStyle) : null;
    buttonElem.style.backgroundImage = imgUrl;

    return buttonElem;
}

function openCloseRunSchemaMenu(schemaName) {
    runSchemaMenu = document.getElementById("run_schema_menu_" + schemaName);
    var openBtn = document.getElementById("button_menu_run_" + schemaName);

    if (runSchemaMenu.style.display == "none") {
        openBtn.style.backgroundImage =
            "url('../../static/icons/open_run_menu_icon_active.svg')";
        runSchemaMenu.style.display = "block";
        getRunningApp(schemaName);
    } else {
        openBtn.style.backgroundImage =
            "url('../../static/icons/open_run_menu_icon.svg')";
        runSchemaMenu.style.display = "none";
    }
}

function openCloseLogWindow(schemaName) {
    var trimmedSchemaName = schemaName.replace(/\s/g, "").trim();

    logWindow = document.getElementById("log_window_" + trimmedSchemaName);
    $buttoImg = $(document.getElementById("img_log_" + trimmedSchemaName));
    if (logWindow.style.display == "none") {
        document.getElementById(
            "log_" + trimmedSchemaName
        ).style.backgroundImage =
            "url('../../static/icons/open_log_window_icon_active.svg')";
        logWindow.style.display = "block";
    } else {
        document.getElementById(
            "log_" + trimmedSchemaName
        ).style.backgroundImage =
            "url('../../static/icons/open_log_window_icon.svg')";
        logWindow.style.display = "none";
    }
    setFocus(false, logWindow.id, schemaName);
}

function closeLogWindow(schemaName) {
    document.getElementById("log_" + schemaName).style.backgroundImage =
        "url('../../static/icons/open_log_window_icon.svg')";
    logWindow = document.getElementById("log_window_" + schemaName);
    $buttoImg = $(document.getElementById("img_log_" + schemaName));
    logWindow.style.display = "none";
}

/*
FUNÇÕES RELATIVAS AO DROPDOWN DO RUN
*/
mainMenuClosed = true;
entrySize = 30; //em px
function createDropDown(schemaName, type, dropDownSize) {
    var dropDown = document.createElement("div");
    dropDown.setAttribute("id", "dd_" + type + "_" + schemaName);
    dropDown.setAttribute("class", "dropdown_run");
    dropDown.setAttribute("style", dropDownSize);
    dropDown.setAttribute(
        "ontransitionend",
        "showDropDownRun('" + schemaName + "' , '" + type + "')"
    );

    //Fechar menu quando clica em alguma opção

    return dropDown;
}

function renderDropDownState(dropDown, schemaName) {
    type = "state";
    var statesNames = ["apply", "learning", "transfer learning", "streaming"];
    for (var iState = 0; iState < statesNames.length; iState++) {
        var option = document.createElement("a");
        option.innerHTML = statesNames[iState];
        option.setAttribute("class", "ddoption_" + type + "_" + schemaName);
        //option.setAttribute("style", "position: relative; display:none; color: white; font-size: 12px");
        option.setAttribute("href", "#");
        dropDown.appendChild(option);
        //Adicionando eventos
        option.addEventListener("click", function (evt) {
            labelSelection = document.getElementById("ddl_state_" + schemaName);
            target =
                evt["target"] || evt["scrElement"] || evt["originalTarget"];
            labelSelection.innerHTML = target["innerHTML"];

            var defaultLeft = 210;
            var realWidth = labelSelection.getBoundingClientRect().width;
            var newLeftValue = realWidth - 30;
            newLeftValue = parseInt(defaultLeft + newLeftValue);
            document.getElementById("dd_plan_" + schemaName).style.left =
                newLeftValue + "px";
        });
    }
    dropDown.setAttribute(
        "onclick",
        "openCloseDropDownRun('" + schemaName + "' , '" + type + "')"
    );
    return [dropDown];
}

function renderDropDownPlan(dropDown, schemaName) {
    type = "plan";

    for (var plan in user_plans) {
        var statusColor;
        var border;
        var option = document.createElement("a");
        option.innerHTML = user_plans[plan]["name"];
        option.setAttribute(
            "title",
            "CPU : " +
                user_plans[plan]["cpu"] +
                " Memory : " +
                user_plans[plan]["memory"]
        );
        option.setAttribute("class", "ddoption_" + type + "_" + schemaName);
        //option.setAttribute("style", "position: relative; display:none; color: white; font-size: 12px");
        option.setAttribute("href", "#");

        var statusDivOption = document.createElement("div");
        statusDivOption.setAttribute(
            "style",
            "display: inline; border-radius: 50%; position: absolute; top: 9px; width: 10px; height: 10px; left: 0; margin-left: 6px;"
        );

        if (!user_plans[plan]["status"]) {
            border = "1px solid green";
            statusColor = "green";
        }

        if (user_plans[plan]["status"]) {
            if (user_plans[plan]["status"] == "running") {
                border = "1px solid green";
                statusColor = "green";
            } else if (
                user_plans[plan]["status"] == "provisioning" ||
                user_plans[plan]["status"] == "occupied"
            ) {
                border = "1px solid yellow";
                statusColor = "yellow";
            }
        }
        statusDivOption.style.backgroundColor = statusColor;

        option.appendChild(statusDivOption);
        dropDown.appendChild(option);
        //Adicionando eventos
        option.addEventListener("click", function (evt) {
            labelSelection = document.getElementById("ddl_plan_" + schemaName);
            target =
                evt["target"] || evt["scrElement"] || evt["originalTarget"];
            labelSelection.innerHTML = target["textContent"];
        });
    }

    var defaulValue;

    dropDown.setAttribute(
        "onclick",
        "openCloseDropDownRun('" + schemaName + "' , '" + type + "')"
    );

    if (user_plans.length > 0 || userInstances.length > 0) {
        if (user_plans.length > 0) {
            defaulValue = user_plans[Object.keys(user_plans)[0]]["name"];
        } else {
            for (var i in userInstances) {
                if (userInstances[i]["status"] == "running") {
                    defaulValue = userInstances[0]["name"];
                    break;
                } else {
                    defaulValue = "No server available";
                }
            }
        }
    } else {
        defaulValue = "No server available";
    }

    return [dropDown, defaulValue];
}

function openCloseDropDownRun(schemaName, type) {
    if (mainMenuClosed == true) {
        if (type == "plan") {
            panzoomInstances[schemaName].pause();
            getUserInstancesAndInsertInDD(schemaName);
            document.getElementById(
                "plan_" + schemaName
            ).style.backgroundImage =
                "url('../../static/icons/server_selection_icon_active.svg')";
        } else
            document.getElementById(
                "state_" + schemaName
            ).style.backgroundImage =
                "url('../../static/icons/application_state_icon_active.svg')";

        //document.getElementById("dd_" + type + "_" + schemaName).focus();
        document.getElementById("dd_" + type + "_" + schemaName).style.display =
            "block";
        document.getElementById(
            "dropdown_" + type + "_arrow_" + schemaName
        ).style.display = "block";

        mainMenuClosed = false;
    } else {
        if (type == "plan")
            document.getElementById(
                "plan_" + schemaName
            ).style.backgroundImage =
                "url('../../static/icons/server_selection_icon.svg')";
        else
            document.getElementById(
                "state_" + schemaName
            ).style.backgroundImage =
                "url('../../static/icons/application_state_icon.svg')";

        panzoomInstances[schemaName].resume();
        document.getElementById("dd_" + type + "_" + schemaName).style.display =
            "none";
        mainMenuClosed = true;
        var menuTextElements = document.getElementsByClassName(
            "ddoption_" + type + "_" + schemaName
        );
        // for (var i = 0; i < menuTextElements.length; i++) {
        //   menuTextElements[i].style.display = "none";
        // }
    }
}

function closeDropDownRun(evt, schemaName, type) {
    //Fecha somente se não for clicado em uma opção do menu

    if (evt["relatedTarget"]) {
        if (evt["relatedTarget"]["className"].startsWith("ddoption") == false) {
            document.getElementById(
                "dd_" + type + "_" + schemaName
            ).style.display = "none";

            if (type == "plan")
                document.getElementById(
                    "plan_" + schemaName
                ).style.backgroundImage =
                    "url('../../static/icons/server_selection_icon.svg')";
            else
                document.getElementById(
                    "state_" + schemaName
                ).style.backgroundImage =
                    "url('../../static/icons/application_state_icon.svg')";

            mainMenuClosed = true;
            var menuTextElements = document.getElementsByClassName(
                "dd_" + type + "_" + schemaName
            );
            // for (var i = 0; i < menuTextElements.length; i++) {
            //   menuTextElements[i].style.display = "none";
            // }
        }
    }
}

function showDropDownRun(schemaName, type) {
    //if (mainMenuClosed == false){
    var menuTextElements = document.getElementsByClassName(
        "ddoption_" + type + "_" + schemaName
    );
    for (var i = 0; i < menuTextElements.length; i++) {
        menuTextElements[i].style.display = "block";
    }
    //}
}

/*
FUNÇÕES QUE ACIONAM O RUN E STOP DA APLICAÇÃO
*/

function startApp(schemaName) {
    var trimmedSchemaName = schemaName.replace(/\s/g, "").trim();
    document.getElementById("logger_table_" + trimmedSchemaName).innerHTML = "";
    //document.getElementById("progress_textarea_"+schemaName).value = "";
    //document.getElementById("img_progress").style.display = "inline-block";
    $(document.getElementById("run_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    document.getElementById("run_" + schemaName).style.opacity = 0.1;

    //$(document.getElementById("stop_"+schemaName)).css("pointer-events", "auto");
    //document.getElementById("stop_"+schemaName).style.opacity = 1;

    $(document.getElementById("state_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    document.getElementById("state_" + schemaName).style.opacity = 0.1;

    $(document.getElementById("plan_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    document.getElementById("plan_" + schemaName).style.opacity = 0.1;

    document.getElementById("running_" + schemaName).style.display =
        "inline-block";

    //Trecho para aumentar largura para o spinner caber dentro do runMenu
    var realWidth = document
        .getElementById("run_schema_menu_" + schemaName)
        .getBoundingClientRect().width;
    realWidth += 60;
    document.getElementById("run_schema_menu_" + schemaName).style.width =
        realWidth + "px";

    document.getElementById("save_app_" + schemaName).style.pointerEvents =
        "none";
    document.getElementById("save_app_" + schemaName).style.opacity = "0.1";
}

function stopApp(schemaName) {
    //document.getElementById("img_progress").style.display = "none";

    $(document.getElementById("run_" + schemaName)).css(
        "pointer-events",
        "auto"
    );
    document.getElementById("run_" + schemaName).style.opacity = 1;

    $(document.getElementById("stop_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    document.getElementById("stop_" + schemaName).style.opacity = 0.1;

    $(document.getElementById("state_" + schemaName)).css(
        "pointer-events",
        "auto"
    );
    document.getElementById("state_" + schemaName).style.opacity = 1;

    $(document.getElementById("plan_" + schemaName)).css(
        "pointer-events",
        "auto"
    );
    document.getElementById("plan_" + schemaName).style.opacity = 1;

    document.getElementById("running_" + schemaName).style.display = "none";
    document.getElementById("run_schema_menu_" + schemaName).style.width =
        "max-content";
    document.getElementById("change_schema_name_button").style.pointerEvents =
        "auto";
    document.getElementById("change_schema_name_button").style.opacity = "1";

    document.getElementById("save_app_" + schemaName).style.pointerEvents =
        "auto";
    document.getElementById("save_app_" + schemaName).style.opacity = "1";
}

function generateID() {
    return [...Array(30)].map((i) => chars[(Math.random() * chars.length) | 0])
        .join``;
}

/*
Pegar o nome do schema corrente (selectedSchema) a partir do nome da div (schemaName)
*/
function getSelectedSchema(schemaName) {
    return document.getElementById("btn_" + schemaName).textContent;
}

function updateComponentStatus(schemaName, componentName) {
    var schemaName_ = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;
    if (lastComponent[schemaName_] != "") {
        schemaName = schemasAliases[schemaName]
            ? schemasAliases[schemaName]
            : schemaName;
        schemaComponents = schemas[schemaName]["components"];

        for (elem in schemaComponents) {
            if (
                lastComponent[schemaName_] ==
                schemaComponents[elem]["parameters"]["name"]
            ) {
                componentId = schemaComponents[elem]["div_id"];
                break;
            }
        }

        // Component Colors
        switch (componentStatus[schemaName_]) {
            case "success":
                document.getElementById(componentId).style.background =
                    "linear-gradient(rgb(29, 67, 0), rgb(0, 100, 0))";
                break;

            case "error":
                document.getElementById(componentId).style.background =
                    "linear-gradient(rgb(100, 0, 0), rgb(200, 0, 0))";
                break;

            case "warning":
                document.getElementById(componentId).style.background =
                    "linear-gradient(rgb(100, 100, 0), rgb(200, 200, 0))";
        }
    }
    lastComponent[schemaName_] = componentName;
    componentStatus[schemaName_] = "success";
}

function restartComponents(schemaName) {
    var oldSchemaName = schemaName;
    schemaName = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;

    lastComponent[schemaName] = "";
    componentStatus[schemaName] = "success";

    currentComponent[schemaName] = "";
    currentComponent[oldSchemaName] = "";

    schemaComponents = schemas[schemaName]["components"];

    for (elem in schemaComponents) {
        component = schemaComponents[elem];
        componentId = component["parameters"]["id_name"];
        div_id = component["div_id"];

        if (nativeComponents.indexOf(componentId) != -1) {
            document.getElementById(div_id).style.background =
                "linear-gradient(" +
                styleCompNative["color-grad"] +
                "," +
                styleCompNative["color"] +
                ")";
        } else {
            document.getElementById(div_id).style.background =
                "linear-gradient(" +
                styleCompCustom["color-grad"] +
                "," +
                styleCompCustom["color"] +
                ")";
        }
    }
}

function beginComponent(schemaName, componentName) {
    schemaName = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;
    currentComponent[schemaName] = componentName;
    schemaComponents = schemas[schemaName]["components"];

    for (elem in schemaComponents) {
        if (componentName == schemaComponents[elem]["parameters"]["name"]) {
            componentId = schemaComponents[elem]["div_id"];
            break;
        }
    }

    document.getElementById(componentId).style.background =
        "linear-gradient(#4e5152, #4e5152)";
}

function getDivId(schemaName, componentName) {
    schemaName = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;
    schemaComponents = schemas[schemaName]["components"];

    for (elem in schemaComponents) {
        if (schemaComponents[elem]["parameters"]["name"] == componentName) {
            return schemaComponents[elem]["div_id"];
        }
    }
}

function clearLogs(schemaName) {
    schemaName = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;
    schemaComponents = schemas[schemaName]["components"];
    for (elem in schemaComponents) {
        if ($("[id='logger_table_" + schemaComponents[elem]["div_id"] + "']")) {
            $("[id='logger_table_" + schemaComponents[elem]["div_id"] + "']")
                .children()
                .remove();
        }
    }
}

var headersList = [];

function schemaLogger(text, schemaName, logHour, msgType) {
    var trimmedSchemaName = schemaName.replace(/\s/g, "").trim();
    var d = new Date();
    message = logHour
        ? d.toLocaleDateString() + " " + d.toLocaleTimeString() + ": " + text
        : text;
    var schemaName_ = schemasAliases[schemaName]
        ? schemasAliases[schemaName]
        : schemaName;

    switch (msgType) {
        case "warning":
            color = "yellow";
            componentStatus[schemaName_] = "warning";
            break;
        case "message":
            color = "white";
            break;
        case "system":
            color = "white";
            break;
        case "error":
            color = "red";
            componentStatus[schemaName_] = "error";
            break;
        case "execution_error":
            componentStatus[schemaName_] = "error";
            break;
        case "success":
            color = "#00cc00";
            break;
        case "df":
            color = "black";
            break;
        default:
            color = "white";
    }
    var schemaTable = document.getElementById(
        "logger_table_" + trimmedSchemaName
    );

    var compTable = document.getElementById(
        "logger_table_" + getDivId(schemaName, currentComponent[schemaName_])
    );

    if (text == "End of application execution") {
        updateComponentStatus(schemaName, "");
    } else {
        if (msgType == "system") {
            if (schemaTable) {
                line = document.createElement("tr");
                col = document.createElement("td");
                col.setAttribute("class", "schema_logger_row");
                col.setAttribute("style", "color: " + color);
                col.innerHTML = message;
                line.appendChild(col);
                schemaTable.appendChild(line);
            }
        } else {
            if (msgType == "df") {
                let col = document.createElement("div");
                col.setAttribute("class", "datasets-table");
                col.setAttribute(
                    "style",
                    "width: max-content; color: black; margin: 0 auto;"
                );
                col.innerHTML = message;
                let br = document.createElement("br");
                let br2 = document.createElement("br");
                schemaTable.appendChild(br);
                schemaTable.appendChild(br2);
                schemaTable.appendChild(col);
                compTable.appendChild(br.cloneNode(true));
                compTable.appendChild(br2.cloneNode(true));
                compTable.appendChild(col.cloneNode(true));

                let headers = schemaTable.querySelectorAll("th.col_heading");

                for (var header of headers) {
                    headersList.push(header.textContent);
                }
            } else if (msgType == "graph") {
                var $p = $("<p>");
                $p.html(message);
                var $p2 = $("<p>");
                $p2.html(message);
                //$p2.draggable().draggable("disable")
                $br = $("<br>");
                $p2.css("margin", "0 auto");
                $p2.css("width", "max-content");
                $("#logger_table_" + schemaName).append($p);
                $(
                    "[id='logger_table_" +
                        getDivId(schemaName, currentComponent[schemaName_]) +
                        "']"
                )
                    .append($br)
                    .append($p2);
            } else if (msgType == "error" || msgType == "warning") {
                if (schemaTable) {
                    let line = document.createElement("tr");
                    let col = document.createElement("td");
                    col.setAttribute("class", "schema_logger_row");
                    col.setAttribute("style", "padding: 15px; color: " + color);
                    col.innerHTML = message;
                    line.appendChild(col);
                    schemaTable.appendChild(line);

                    if (compTable) compTable.appendChild(line.cloneNode(true));
                }
            } else if (msgType == "component") {
                beginComponent(schemaName, text);
                updateComponentStatus(schemaName, text);

                schemaTable = document.getElementById(
                    "logger_table_" +
                        getDivId(schemaName, currentComponent[schemaName_])
                );
                if (schemaTable) {
                    let headers =
                        schemaTable.querySelectorAll("th.col_heading");

                    for (var header of headers) {
                        headersList.push(header.textContent);
                    }
                }
            } else if (msgType == "png") {
                if (schemaTable) {
                    let line = document.createElement("tr");
                    let col = document.createElement("img");
                    col.setAttribute("style", "width:800px; height: 400px;");
                    col.setAttribute(
                        "src",
                        "data:image/png;base64, " + message
                    );
                    line.appendChild(col);
                    schemaTable.appendChild(line);
                    compTable.appendChild(line.cloneNode(true));
                }
            } else {
                if (schemaTable) {
                    let line = document.createElement("tr");
                    let col = document.createElement("td");
                    col.setAttribute("class", "schema_logger_row");
                    col.setAttribute("style", "color: " + color);
                    col.innerHTML = message;
                    line.appendChild(col);
                    schemaTable.appendChild(line);
                    if (compTable) compTable.appendChild(line.cloneNode(true));
                }
            }
        }
    }

    // if (msgType == "df") {
    //     console.log(message)
    //     schemaTable = document.getElementById(
    //         "logger_table_" +
    //         getDivId(schemaName, currentComponent[schemaName_])
    //     );
    //     if (schemaTable) {
    //         col = document.createElement("div");
    //         col.setAttribute("class", "datasets-table");
    //         col.setAttribute("style", "width: max-content; color: black; margin: 0 auto;");
    //         col.innerHTML = message;
    //         br = document.createElement("br");
    //         br2 = document.createElement("br");
    //         schemaTable.appendChild(br);
    //         schemaTable.appendChild(br2);
    //         schemaTable.appendChild(col);

    //         let headers = schemaTable.querySelectorAll("th.col_heading");

    //         for (var header of headers) {
    //             headersList.push(header.textContent);
    //         }
    //     }
    // }
    // if (msgType == "graph") {
    //     var $p = $("<p>");
    //     $p.html(message);
    //     var $p2 = $("<p>");
    //     $p2.html(message);
    //     //$p2.draggable().draggable("disable")
    //     $br = $("<br>");
    //     $p2.css("margin", "0 auto")
    //     $p2.css("width", "max-content")
    //     $("#logger_table_" + schemaName).append($p);
    //     $(
    //         "[id='logger_table_" +
    //         getDivId(schemaName, currentComponent[schemaName_]) +
    //         "']"
    //     )
    //         .append($br)
    //         .append($p2);
    // } else if (msgType == "component") {
    //     beginComponent(schemaName, text);
    //     updateComponentStatus(schemaName, text);

    //     schemaTable = document.getElementById(
    //         "logger_table_" +
    //         getDivId(schemaName, currentComponent[schemaName_])
    //     );
    //     if (schemaTable) {

    //         let headers = schemaTable.querySelectorAll("th.col_heading");

    //         for (var header of headers) {
    //             headersList.push(header.textContent);
    //         }
    //     }
    // }
    // else if (msgType == "error" || msgType == "warning") {
    //     schemaTable = document.getElementById(
    //         "logger_table_" +
    //         getDivId(schemaName, currentComponent[schemaName_])
    //     );
    //     if (schemaTable) {
    //         line = document.createElement("tr");
    //         col = document.createElement("td");
    //         col.setAttribute("class", "schema_logger_row");
    //         col.setAttribute("style", "padding: 15px; color: " + color);
    //         col.innerHTML = message;
    //         line.appendChild(col);
    //         schemaTable.appendChild(line);
    //     }
    // }

    // else if (msgType == 'message') {
    //     schemaTable = document.getElementById(
    //       "logger_table_" + trimmedSchemaName
    //     );
    //     var compTable = document.getElementById(
    //       "logger_table_" + getDivId(schemaName, currentComponent[schemaName_])
    //     );
    //     if (compTable) {
    //       line = document.createElement("tr");
    //       col = document.createElement("td");
    //       col.setAttribute("class", "schema_logger_row");
    //       col.setAttribute("style", "color: " + color);
    //       col.innerHTML = message;
    //       line.appendChild(col);
    //       let lineClone = line.cloneNode()
    //       console.log(lineClone)
    //       if (compTable) {
    //           console.log(compTable)
    //           compTable.appendChild(lineClone);
    //       }
    //       schemaTable.appendChild(line);
    //     }
    // }
}
/*
Verifica se teve alterações no schema
*/
function verifyChanges(oldApplicationJSONs) {
    updateSchemas();
    currentApplicationJSONs = {};
    currentApplicationJSONs["studio_schemas"] = schemas;
    currentApplicationJSONs["info"] = applicationsInfo[currentApplication];

    currentApplicationJSONS = handleJson(currentApplicationJSONs);
    return _.isEqual(oldApplicationJSONs, currentApplicationJSONs);
}

/*Função específica para tratar exceções no JSON da aplicação, para evitar inconsistências ao comparar os dois JSONs  */
function handleJson(applicationJSON) {
    var field;
    var schemas = Object.keys(applicationJSON["studio_schemas"]);
    for (var iSchema = 0; iSchema < schemas.length; iSchema++) {
        //For para verificar cada parâmetro de cada componente, caso seja booleano converte para string e devolve ao Json
        var components =
            applicationJSON["studio_schemas"][schemas[iSchema]]["components"];
        for (var iComp = 0; iComp < components.length; iComp++) {
            var parameters = Object.keys(components[iComp]["parameters"]);
            for (var iParam = 0; iParam < parameters.length; iParam++) {
                if (
                    typeof applicationJSON["studio_schemas"][schemas[iSchema]][
                        "components"
                    ][iComp]["parameters"][parameters[iParam]] == "boolean"
                ) {
                    field =
                        applicationJSON["studio_schemas"][schemas[iSchema]][
                            "components"
                        ][iComp]["parameters"][parameters[iParam]];
                    field = field.toString();
                    applicationJSON["studio_schemas"][schemas[iSchema]][
                        "components"
                    ][iComp]["parameters"][parameters[iParam]] = field;
                }
            }
        }
        //Remove connections_id para evitar divergências nas comparações
        var connections =
            applicationJSON["studio_schemas"][schemas[iSchema]]["connections"];
        for (var iCon = 0; iCon < connections.length; iCon++) {
            delete connections[iCon]["connection_id"];
        }
    }
    return applicationJSON;
}
/*
Roda a aplicação
*/
function runApplication(schemaName) {
    clearLogs(schemaName);

    document.getElementById("change_schema_name_button").style.pointerEvents =
        "none";
    document.getElementById("change_schema_name_button").style.opacity = "0.5";

    schemas_ = getSchemas();
    oldApplicationJSONs = {};
    oldApplicationJSONs["studio_schemas"] = schemas_;
    oldApplicationJSONs["info"] = applicationsInfo[currentApplication];
    var oldApplicationJSONs = handleJson(oldApplicationJSONs);

    var instanceId;
    var hasWebApi = false;

    if (schemasAliases[schemaName]) {
        for (var c in oldApplicationJSONs["studio_schemas"][
            schemasAliases[schemaName]
        ]["components"]) {
            if (
                oldApplicationJSONs["studio_schemas"][
                    schemasAliases[schemaName]
                ]["components"][c]["parameters"]["id_name"] == "Web API Input"
            )
                hasWebApi = true;
        }
    } else {
        for (var c in oldApplicationJSONs["studio_schemas"][schemaName][
            "components"
        ]) {
            if (
                oldApplicationJSONs["studio_schemas"][schemaName]["components"][
                    c
                ]["parameters"]["id_name"] == "Web API Input"
            )
                hasWebApi = true;
        }
    }

    if (!verifyChanges(oldApplicationJSONs)) {
        messagesLog("Save your application before running");
        $(document.getElementById("run_" + schemaName)).css(
            "pointer-events",
            "none"
        );
        document.getElementById("run_" + schemaName).style.opacity = 0.1;
    } else {
        restartComponents(schemaName);

        selectedSchema[schemaName] = getSelectedSchema(schemaName);
        //app_id = generateID();
        schemasExecutionID[schemaName] = generateID();
        isValidSchemas = getIsValidSchemas(); //De applications control
        if (isValidSchemas[selectedSchema[schemaName]] == false) {
            messagesLog(
                "There are errors in schema: " + selectedSchema[schemaName]
            );
            return false;
        }

        startApp(schemaName);
        //openCloseLogWindow(schemaName)
        messagesLog("Application requested to run");
        schemaLogger(
            "Application requested to run",
            schemaName,
            true,
            "message"
        );
        schemaLogger(
            "Application Execution ID: " + schemasExecutionID[schemaName],
            schemaName,
            false,
            "message"
        );

        currentApplicationJSON = {};
        currentApplicationJSON["application_name"] = currentApplication; //currentApplication é variável de applicationsControl
        currentApplicationJSON["schema_name"] = schemaName;

        $.ajax({
            url: "/delete-logs?" + JSON.stringify(currentApplicationJSON),
            type: "POST",
            processData: false,
            contentType: false,
            dataType: "json",
            success: function (data) {
                if (data) {
                    endAppFlag[selectedSchema[schemaName]] = false;
                    //Pega o request corrente do combobox
                    //var comboBox = document.getElementById("cbstate_"+schemaName);
                    //selectedtState = document.getElementById("cbstate_"+schemaName).options[comboBox.selectedIndex].text;
                    selectedtState = document.getElementById(
                        "ddl_state_" + schemaName
                    ).innerHTML;
                    selectedPlan = document.getElementById(
                        "ddl_plan_" + schemaName
                    ).textContent;
                    //var comboBox = document.getElementById("cbplan_"+schemaName);
                    //selectedPlan = document.getElementById("cbplan_"+schemaName).options[comboBox.selectedIndex].text;

                    for (var i in userInstances) {
                        if (
                            document.getElementById("ddl_plan_" + schemaName)
                                .textContent == userInstances[i]["name"]
                        ) {
                            selectedPlan =
                                userInstances[i]["cloud_provider"] +
                                "." +
                                userInstances[i]["instance_type"];
                            instanceId = userInstances[i]["id"];
                            break;
                        } else {
                            selectedPlan = document.getElementById(
                                "ddl_plan_" + schemaName
                            ).textContent;
                        }
                    }

                    runApplicationRequisition(
                        selectedSchema[schemaName],
                        selectedtState,
                        selectedPlan,
                        schemasExecutionID[schemaName],
                        schemaName,
                        instanceId,
                        hasWebApi
                    ); //Função de applicationsControl
                    runningApp[selectedSchema[schemaName]] = true;
                }
            },
        });
    }
}

/*
Pára a execuação da aplicação
*/
function stopApplication(schemaName) {
    stopSchema =
        schemaName in schemasAliases ? schemasAliases[schemaName] : schemaName;
    messagesLog("Application requested to stop");
    $(document.getElementById("stop_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    document.getElementById("stop_" + schemaName).style.opacity = 0.1;
    stopApplicationRequisition(stopSchema); //Função de applicationsControl
}

function getRunningApp(schemaName) {
    applicationJson = {};
    applicationJson["app_name"] = currentApplication;
    applicationJson["schema_name"] = getSelectedSchema(schemaName);

    if (!runningApp[getSelectedSchema(schemaName)]) {
        $.ajax({
            url: "/get-running-application",
            data: applicationJson,
            type: "GET",
            dataType: "json",
            async: false,
            statusCode: {
                404: function () {
                    console.log("page not found");
                },
            },
            success: function (data) {
                if (data) {
                    startApp(schemaName);
                    openCloseLogWindow(schemaName);
                    schemaLogger(
                        "Application Resumed",
                        schemaName,
                        true,
                        "message"
                    );
                    messagesLog("Application Resumed");
                    getLogs(schemaName);
                    $(document.getElementById("stop_" + schemaName)).css(
                        "pointer-events",
                        "auto"
                    );
                    document.getElementById(
                        "stop_" + schemaName
                    ).style.opacity = 1;
                }
            },
        });
    }
}

/*
Fazer o GET do LOG do SOMMA Core
*/

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLogs(schemaName) {
    timeoutCount = 0;

    while (!endAppFlag[selectedSchema[schemaName]]) {
        //selectedSchema[schemaName] = getSelectedSchema(schemaName);
        currentApplicationJSON = {};
        currentApplicationJSON["application_name"] = currentApplication; //currentApplication é variável de applicationsControl
        currentApplicationJSON["schema_name"] = getSelectedSchema(schemaName);
        currentApplicationJSONS = JSON.stringify(currentApplicationJSON);

        $.ajax({
            url: "/get-application-progress?" + currentApplicationJSONS,
            type: "GET",
            dataType: "json",
            async: true,
            statusCode: {
                404: function () {
                    console.log("page not found");
                },
            },
            success: function (data) {
                if (data.length > 0) {
                    timeoutCount = 0;
                    for (var iLine = 0; iLine < data.length; iLine++) {
                        //document.getElementById("progress_textarea_" + schemaName).value = document.getElementById("progress_textarea_" + schemaName).value + data[iLine]["message"] + "\n";
                        if (data[iLine]["message"] != "end") {
                            schemaLogger(
                                data[iLine]["message"],
                                schemaName,
                                false,
                                data[iLine]["type"]
                            );
                        }
                    }
                    if (data[data.length - 1]["message"] == "end") {
                        stopApp(schemaName);
                        getUserInfo();
                        messagesLog("End of application execution");
                        schemaLogger(
                            "End of application execution",
                            schemaName,
                            true,
                            "system"
                        );
                        endAppFlag[selectedSchema[schemaName]] = true;
                        runningApp[selectedSchema[schemaName]] = false;
                        timeoutCount = 0;
                    }
                } else {
                    timeoutCount++;
                }
            },
        });

        if (timeoutCount > 5) {
            $.ajax({
                url: "/get-application-status-name?" + currentApplicationJSONS,
                type: "GET",
                dataType: "text",
                async: true,
                statusCode: {
                    404: function () {
                        console.log("page not found");
                    },
                },
                success: function (data) {
                    if (
                        ["finished", "error", "timeout", "stopped"].indexOf(
                            data
                        ) >= 0
                    ) {
                        stopApp(schemaName);
                        messagesLog("End of application execution");
                        schemaLogger(
                            "Application " + data,
                            schemaName,
                            true,
                            "message"
                        );
                        endAppFlag[selectedSchema[schemaName]] = true;
                        runningApp[selectedSchema[schemaName]] = false;
                        return;
                    }
                },
            });
        }
        await timeout(2000);
    }
}

async function getApplicationStatus(app_id, schemaName) {
    requests_count[schemaName] = 0;
    running = false;

    do {
        $.ajax({
            url:
                "/get-application-status?app_id=" +
                app_id +
                "&request_number=" +
                requests_count[schemaName],
            type: "GET",
            dataType: "text",
            success: function (data) {
                if (data == "Application Started") {
                    messagesLog("Application Started Running");
                    schemaLogger(
                        "Application Started Running",
                        schemaName,
                        true,
                        "message"
                    );
                    getLogs(schemaName);
                    $(document.getElementById("stop_" + schemaName)).css(
                        "pointer-events",
                        "auto"
                    );
                    document.getElementById(
                        "stop_" + schemaName
                    ).style.opacity = 1;
                    requests_count[schemaName] = 16;
                } else if (data == "Application Timed Out") {
                    stopApp(schemaName);
                    endAppFlag[selectedSchema[schemaName]] = true;
                    schemaLogger(
                        "Application Timed Out",
                        schemaName,
                        true,
                        "message"
                    );
                    messagesLog(data);
                    //document.getElementById("progress_textarea").value += data
                    runningApp[selectedSchema[schemaName]] = false;
                    requests_count[schemaName] = 16;
                }
            },
            error: function (data) {
                stopApp(schemaName);
                endAppFlag[selectedSchema] = true;
                schemaLogger(
                    "Unknown Error, try again in a few minutes",
                    schemaName,
                    true,
                    "error"
                );
                messagesLog("Unknown Error, try again in a few minutes");
                runningApp[selectedSchema] = false;
                requests_count[schemaName] = 16;
            },
        });
        await timeout(1000);
        requests_count[schemaName]++;
    } while (requests_count[schemaName] <= 15);

    //selectedSchema[schemaName] = getSelectedSchema(schemaName);
    // $.ajax({
    //   //url: "/get-application-status?application_name=" + currentApplication,
    //   url: "/get-application-status?app_id=" + app_id,
    //   type: 'GET',
    //   dataType: 'text',
    //   success: function (data) {
    //     if (data == "Application Started"){
    //       messagesLog("Application Started Running");
    //       schemaLogger("Application Started Running", schemaName, true, "message")
    //       getLogs(schemaName);
    //       $(document.getElementById("stop_" + schemaName)).css("pointer-events", "auto");
    //       document.getElementById("stop_" + schemaName).style.opacity = 1;
    //       //document.getElementById("stop_app_button").disabled = false;
    //     }
    //     else{
    //       stopApp(schemaName);
    //       endAppFlag[selectedSchema[schemaName]] = true;
    //       messagesLog(data);
    //       //document.getElementById("progress_textarea").value += data
    //       runningApp[selectedSchema[schemaName]] = false;
    //     }
    //   }
    // });
}

/*-------------------------------*/
