var userInstances;

/*Função para validar caracteres especiais em alguns locais*/

function validateIntegrity(string, field) {
    var regex;

    if (field)
        field == "server_name"
            ? (regex = /[`!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/)
            : /[`!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    else regex = /[`!@#$%^&+()\-=\[\]{};':"\\|,.<>\/?~]/;

    if (typeof string == "string") {
        if (string.includes("-xx-") || regex.test(string)) {
            messagesLog("Fields cannot contain special characters");
            return false;
        } else {
            return true;
        }
    }
}

/*Função específica para validar esquemas. Caso o nome do esquema seja igual à algum id_name, avise o usuário*/
function verifyIfContainsIdName(string, idNames, field) {
    var contain = true;
    for (var i = 0; i < idNames.length; i++) {
        if (string == idNames[i]) {
            messagesLog(field + " cannot be id_name of a component");
            contain = false;
        }
    }
    return contain;
}

String.prototype.rsplit = function (sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit
        ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit))
        : split;
};

function isNumeric(n) {
    return !isNaN(parseInt(n)) && isFinite(n);
}

/* Função para bloquear campos com muitos caracteres */
function verifyStringSize(type, string) {
    if (type == "application_name") {
        if (string.length > 25) {
            if (string[25] == "*" && isNumeric(string.rsplit("*", 1)[1]))
                return true;
            else {
                messagesLog(
                    "Application name cannot be greater than 25 characters"
                );
                return false;
            }
        } else return true;
    } else if (type == "schema_name") {
        if (string.length > 24) {
            messagesLog("Schema name cannot be greater than 24 characters");
            return false;
        } else return true;
    }
}

/*Função que renderizá o botão de ajuda (somma wikki dos componentes) no canto inferior direito após abrir uma aplicação*/
function renderSommaWiki() {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;

    s.src =
        "https://embedder.upraise.io/ext/widget/embed_confluence_search_init.js?widgetId=a5470750-bb1e-11ea-a5aa-73a40e7817cd&clientKey=fc94dddd-64e2-3762-beff-b4db8eb08479";
    s.onload = s.onreadystatechange = function () {
        // can add logic to load widget or not
        var wh = new window.embedConfluenceWidget();
    };
    var mainPage = document.getElementById("main-page");
    mainPage.appendChild(s);
}

/*Função para fechar a tela de aplicações (geralmente quando abre uma aplicação) */
function closeModals() {
    document.getElementById("modal_applications").style.display = "none";
    // document.getElementById("readme_div").style.display = "none";
    // document.getElementById("readme_area").style.display = "none";
}
/*Chat DIscord, botão e iframe */

function renderDiscordButton() {
    var mainPage = document.getElementById("main-page");

    var launcherDiv = document.createElement("div");
    launcherDiv.id = "chat-container";
    launcherDiv.style.display = "none";

    var laucherBtn = document.createElement("div");
    laucherBtn.className = "chat-circle";
    laucherBtn.style.cursor = "pointer";
    laucherBtn.style.fontSize = "100px";
    laucherBtn.style.color = "#ff0000";
    laucherBtn.title = "Support Chat";
    launcherDiv.appendChild(laucherBtn);
    laucherBtn.addEventListener("click", function () {
        prepareFrame();
    });

    mainPage.appendChild(launcherDiv);
}

function toggleIframeVisibility() {
    if (document.getElementById("chat-iframe")) {
        if (document.getElementById("chat-iframe").style.display == "block") {
            document.getElementById("chat-iframe").style.display = "none";
        } else {
            document.getElementById("chat-iframe").style.display = "block";
        }
    }
}
function prepareFrame() {
    if (!document.getElementById("chat-iframe")) {
        var ifrm = document.createElement("iframe");
        ifrm.id = "chat-iframe";
        ifrm.src =
            "https://titanembeds.com/embed/738171968901087253?css=148&defaultchannel=" +
            chat_id +
            "&scrollbartheme=dark-3&scrollbartheme=rounded-dots&theme=IceWyvern";
        ifrm.width = "300px";
        ifrm.height = "480px";
        ifrm.style.position = "absolute";
        ifrm.style.borderRadius = "5px";
        ifrm.style.bottom = "20px";
        ifrm.style.right = "75px";
        ifrm.style.display = "block";
        ifrm.frameBorder = "0";
        document.getElementById("chat-container").appendChild(ifrm);
    } else {
        toggleIframeVisibility();
    }

    /*var ifrm = document.createElement("iframe");
        ifrm.src =  "https://titanembeds.com/embed/738171968901087253?defaultchannel=742493287730118656&scrollbartheme=dark-3&theme=DiscordDark&username=usuario-teste";
        ifrm.width = "300px";
        ifrm.height = "480px";
        ifrm.style = "position: absolute; display: block;";
        ifrm.frameBorder = "0";
        mainPage.appendChild(ifrm); */
}
//Função para utilizar o ícone nos campos de senha para exibir/ocultar os campos de senha
function togglePasswordsVisibility(password_id1, password_id2) {
    pwd1 = document.getElementById(password_id1);
    pwd2 = document.getElementById(password_id2);
    if (pwd1.type === "text" && pwd2.type === "text") {
        pwd1.type = "password";
        pwd2.type = "password";
    } else {
        pwd1.type = "text";
        pwd2.type = "text";
    }
}

var selectedInstanceId;
var plan_;
function insertUserInstancesInDD(instances, appSchema) {
    var dropDown = document.getElementById("dd_plan_" + appSchema);
    var ddChildNodes = dropDown.childNodes;

    var ddOptions = [];
    for (var ch in ddChildNodes) {
        if (ddChildNodes[ch].id != "dropdown_plan_arrow_" + appSchema) {
            if (ddChildNodes[ch].id) {
                var ddoption = document.getElementById(ddChildNodes[ch].id);
                ddOptions.push(ddoption);
            }
        }
    }

    for (var j = 0; j < ddOptions.length; j++) {
        document.getElementById(ddOptions[j].id).remove();
    }

    for (var i in instances) {
        var option = document.createElement("a");
        option.setAttribute(
            "title",
            "CPU : " +
                instances[i]["cpu"] +
                " Memory : " +
                instances[i]["memory"] +
                " Instance : " +
                instances[i]["instance_type"] +
                " Status : " +
                instances[i]["status"]
        );
        option.setAttribute("class", "ddoption_plan" + "_" + appSchema);
        option.setAttribute("href", "#");
        option.setAttribute(
            "id",
            "option_instance_" + i + "_schema_" + appSchema
        );
        option.setAttribute(
            "onclick",
            "selectInstance(event, '" +
                instances[i]["status"] +
                "', '" +
                instances[i]["id"] +
                "', '" +
                instances[i]["cloud_provider"] +
                "', '" +
                instances[i]["instance_type"] +
                "', '" +
                appSchema +
                "');"
        );

        option.textContent = instances[i]["name"];

        var statusDivOption = document.createElement("div");
        statusDivOption.setAttribute(
            "style",
            "display: inline; border-radius: 50%; position: absolute; top: 9px; width: 10px; height: 10px; left: 0; margin-left: 6px;"
        );

        if (instances[i]["status"]) {
            if (instances[i]["status"] == "running") {
                border = "1px solid green";
                statusColor = "green";
            } else if (
                instances[i]["status"] == "provisioning" ||
                instances[i]["status"] == "occupied"
            ) {
                border = "1px solid yellow";
                statusColor = "yellow";
            }
        }
        statusDivOption.style.border = border;
        statusDivOption.style.backgroundColor = statusColor;

        option.appendChild(statusDivOption);

        dropDown.appendChild(option);
    }
}

function selectInstance(
    evt,
    instanceStatus,
    instanceId,
    instanceCloudProvider,
    instanceType,
    appSchema
) {
    if (instanceStatus == "running") {
        labelSelection = document.getElementById("ddl_plan_" + appSchema);
        target = evt["target"] || evt["scrElement"] || evt["originalTarget"];
        labelSelection.innerHTML = target["textContent"];
        selectedInstanceId = instanceId;
        // plan_ = instanceCloudProvider + "." + instanceType
    } else messagesLog("Machine is unavailable");
}

function removeOptionInDropDown(serverNames) {
    var schemas = getSchemas();

    for (var s in schemas) {
        if (document.getElementById("ddl_plan_" + s)) {
            for (var name in serverNames) {
                if (
                    document.getElementById("ddl_plan_" + s).textContent ==
                    serverNames[name]
                ) {
                    if (user_plans.length > 0) {
                        document.getElementById("ddl_plan_" + s).textContent =
                            user_plans[0]["name"];
                    } else {
                        document.getElementById("ddl_plan_" + s).textContent =
                            "No server available";
                    }
                }
            }
        }
    }
}

function getUserInstancesAndInsertInDD(schema) {
    $.ajax({
        url: "/get-user-machines",
        type: "GET",
        dataType: "json",
        success: function (data) {
            //   console.log(data);
            userInstances = data;
            insertUserInstancesInDD(userInstances, schema);
        },
    });
}

function getUserInstances() {
    $.ajax({
        url: "/get-user-machines",
        type: "GET",
        dataType: "json",
        success: function (data) {
            //   console.log(data);
            userInstances = data;
        },
    });
}

function sumValuesInArray(arr) {
    var sum = 0;
    var count = 0;
    for (var i in arr) {
        sum += arr[i];
        count++;
    }
    return sum;
}

/*
Faz o tratamento de funções do teclado
Essa função é chamada para cada schema criado (schemas.js)
*/

var blockKeyboardsEvt = false;
var isCut = false;
var undoCommands = [];
var redoCommands = [];

function componentsKeyboardEvt(evt, appSchema) {
    if (evt.keyCode == 46) {
        isCut = false;
        removeComponents(appSchema);
    } else if (
        (evt.keyCode == 67 && evt.ctrlKey) ||
        (evt.type == "click" && evt.srcElement.id == "copy_components_icon")
    ) {
        isCut = false;
        copyComponents(appSchema);
    } else if (
        (evt.keyCode == 86 && evt.ctrlKey) ||
        (evt.type == "click" && evt.srcElement.id == "paste_components_icon")
    ) {
        if (blockKeyboardsEvt == false) {
            pasteComponents(appSchema);
        }
    } else if (
        (evt.keyCode == 88 && evt.ctrlKey) ||
        (evt.type == "click" && evt.srcElement.id == "cut_components_icon")
    ) {
        isCut = true;
        copyComponents(appSchema);
        removeComponents(appSchema);
    } else if (evt.keyCode == 65 && evt.ctrlKey) {
        selectAllComponents(appSchema, evt);
    } else if (
        (evt.keyCode == 90 && evt.ctrlKey && evt.shiftKey) ||
        (evt.type == "click" && evt.srcElement.id == "redo_actions_icon")
    ) {
        if (blockKeyboardsEvt == false) {
            undoRedoAction(appSchema, true);
        }
    } else if (
        (evt.keyCode == 90 && evt.ctrlKey) ||
        (evt.type == "click" && evt.srcElement.id == "undo_actions_icon")
    ) {
        if (blockKeyboardsEvt == false) {
            undoRedoAction(appSchema, false);
        }
    }
}

function enableOrDisablePanzoom(evt, appSchema) {
    if (evt.ctrlKey) {
        document.getElementById("box_item_" + appSchema).style.cursor = "move";
        panzoomInstances[appSchema].resume();
    } else {
        document.getElementById("box_item_" + appSchema).style.cursor = "unset";
        panzoomInstances[appSchema].pause();
    }
}

function setOnclickInputs(idComp, idSticker) {
    if (idComp) {
        var ul = document.getElementById("listParameters" + idComp);
        var inputsList = [];
        var list = ul.childNodes;
        for (var i = 0; i < list.length; i++) {
            inputsList.push(list[i].querySelectorAll("input"));
        }

        for (let nodeList of inputsList) {
            for (let input of nodeList) {
                input.addEventListener("keydown", function (evt) {
                    if (evt.keyCode == 86 && evt.ctrlKey) {
                        blockKeyboardsEvt = true;
                    } else if (evt.keyCode == 90 && evt.ctrlKey) {
                        blockKeyboardsEvt = true;
                    } else if (
                        evt.keyCode == 90 &&
                        evt.ctrlKey &&
                        evt.shiftKey
                    ) {
                        blockKeyboardsEvt = true;
                    }
                });

                input.addEventListener("keyup", function (evt) {
                    if (evt.keyCode == 86 && evt.ctrlKey) {
                        blockKeyboardsEvt = false;
                    } else if (evt.keyCode == 90 && evt.ctrlKey) {
                        blockKeyboardsEvt = false;
                    } else if (
                        evt.keyCode == 90 &&
                        evt.ctrlKey &&
                        evt.shiftKey
                    ) {
                        blockKeyboardsEvt = false;
                    }
                });
            }
        }
    } else if (idSticker) {
        var stickerDiv = document.getElementById(idSticker);
        stickerDiv.addEventListener("keydown", function (evt) {
            if (evt.keyCode == 86 && evt.ctrlKey) {
                blockKeyboardsEvt = true;
            } else if (evt.keyCode == 90 && evt.ctrlKey) {
                blockKeyboardsEvt = true;
            } else if (evt.keyCode == 90 && evt.ctrlKey && evt.shiftKey) {
                blockKeyboardsEvt = true;
            }
        });

        stickerDiv.addEventListener("keyup", function (evt) {
            if (evt.keyCode == 86 && evt.ctrlKey) {
                blockKeyboardsEvt = false;
            } else if (evt.keyCode == 90 && evt.ctrlKey) {
                blockKeyboardsEvt = false;
            } else if (evt.keyCode == 90 && evt.ctrlKey && evt.shiftKey) {
                blockKeyboardsEvt = false;
            }
        });
    }
}

function undoRedoAction(appSchema, isRedo) {
    var appSchema_ = appSchema; //Nome do esquema antigo caso tenha alterado
    appSchema = schemasAliases[appSchema]
        ? schemasAliases[appSchema]
        : appSchema;

    if (isRedo == true) {
        lastCommand = redoCommands[0];
        if (lastCommand) {
            if (Object.keys(lastCommand) == "cutComponents") {
                if (lastCommand["cutComponents"].length == 0) {
                    redoCommands.shift();
                    lastCommand = redoCommands[0];
                }
            } else if (Object.keys(lastCommand) == "removeComponent") {
                if (lastCommand["removeComponent"].length == 0) {
                    redoCommands.shift();
                    lastCommand = redoCommands[0];
                }
            }
        }
    } else {
        lastCommand = undoCommands[0];
        if (lastCommand) {
            if (Object.keys(lastCommand) == "cutComponents") {
                if (lastCommand["cutComponents"].length == 0) {
                    undoCommands.shift();
                    lastCommand = undoCommands[0];
                }
            } else if (Object.keys(lastCommand) == "removeComponent") {
                if (lastCommand["removeComponent"].length == 0) {
                    undoCommands.shift();
                    lastCommand = undoCommands[0];
                }
            }
        }
    }

    var command;
    lastCommand != undefined ? (command = Object.keys(lastCommand)) : null;

    if (lastCommand) {
        if (lastCommand[command]["schema"] != appSchema) {
            openDivSchema(event, lastCommand[command]["schema"]);
            document.getElementById("btn_" + lastCommand[command]["schema"]) !=
            null
                ? document
                      .getElementById("btn_" + lastCommand[command]["schema"])
                      .click()
                : document
                      .getElementById(
                          "btn_" +
                              schemasAliases[lastCommand[command]["schema"]]
                      )
                      .click();
            setFocus(true, lastCommand[command]["schema"]);
            appSchema = lastCommand[command]["schema"];
        }
    }

    if (isRedo == true) {
        if (lastCommand[command]["schema"]) {
            appSchema_ = schemasAliases[lastCommand[command]["schema"]]
                ? schemasAliases[lastCommand[command]["schema"]]
                : lastCommand[command]["schema"];
        }
    }

    if (command == "createComponent") {
        if (isRedo == true) {
            createComponent(
                lastCommand[command]["divId"].split("-xx-")[0],
                appSchema_,
                lastCommand[command]["position"],
                lastCommand[command]["schema"]
            );
            redoCommands.shift();
        } else {
            menuId = "wrapper_menu_" + lastCommand[command]["divId"];
            removeComponent(
                menuId,
                lastCommand[command]["divId"],
                appSchema,
                true
            );
            if (redoCommands.length == 5) redoCommands.pop();

            redoCommands.unshift({ createComponent: lastCommand[command] });
            undoCommands.shift();
        }
    } else if (command == "removeComponent") {
        if (isRedo == true) {
            menuId =
                "wrapper_menu_" +
                lastCommand[command]["component_info"]["div_id"];
            removeComponent(
                menuId,
                lastCommand[command]["component_info"]["div_id"],
                appSchema,
                null,
                false
            );
            redoCommands.shift();
        } else {
            createLoadedComponent(
                lastCommand[command]["component_info"],
                appSchema
            );

            for (
                var iConn = 0;
                iConn < lastCommand[command]["connections"].length;
                iConn++
            ) {
                newDivIdSource =
                    lastCommand[command]["connections"][iConn]["source_id"];
                newDivIdTarget =
                    lastCommand[command]["connections"][iConn]["target_id"];
                if (
                    document.getElementById(newDivIdSource) &&
                    document.getElementById(newDivIdTarget)
                ) {
                    if (
                        newDivIdSource != undefined &&
                        newDivIdTarget != undefined
                    ) {
                        source = newDivIdSource + "_0";
                        target = newDivIdTarget + "_1";
                        j.connect({ uuids: [source, target] });
                    }
                }
            }
            if (redoCommands.length == 5) redoCommands.pop();

            var redoJson = {};
            redoJson["component_info"] = lastCommand[command]["component_info"];
            redoJson["schema"] = appSchema;
            redoCommands.unshift({ removeComponent: redoJson });
            undoCommands.shift();
        }
    } else if (command == "removeMultipleComponents") {
        if (isRedo == true) {
            updateSchemas();
            lastCommand[command]["schema"] = schemasAliases[
                lastCommand[command]["schema"]
            ]
                ? schemasAliases[lastCommand[command]["schema"]]
                : lastCommand[command]["schema"];
            var divIds = lastCommand[command]["divIds"];
            removeComponents(lastCommand[command]["schema"], true, divIds);
            redoCommands.shift();
        } else {
            componentsObj = lastCommand[command];
            var divIds = [];
            for (var comp in componentsObj) {
                if (typeof componentsObj[comp] == "object") {
                    divIds.push(
                        componentsObj[comp]["component_info"]["div_id"]
                    );

                    createLoadedComponent(
                        componentsObj[comp]["component_info"],
                        appSchema
                    );
                    for (
                        var iConn = 0;
                        iConn < componentsObj[comp]["connections"].length;
                        iConn++
                    ) {
                        newDivIdSource =
                            componentsObj[comp]["connections"][iConn][
                                "source_id"
                            ];
                        newDivIdTarget =
                            componentsObj[comp]["connections"][iConn][
                                "target_id"
                            ];
                        if (
                            document.getElementById(newDivIdSource) &&
                            document.getElementById(newDivIdTarget)
                        ) {
                            if (
                                newDivIdSource != undefined &&
                                newDivIdTarget != undefined
                            ) {
                                source = newDivIdSource + "_0";
                                target = newDivIdTarget + "_1";
                                j.connect({ uuids: [source, target] });
                            }
                        }
                    }
                }
            }
            if (redoCommands.length == 5) redoCommands.pop();

            var redoJson = {};
            redoJson["divIds"] = divIds;
            redoJson["schema"] = appSchema;
            redoCommands.unshift({ removeMultipleComponents: redoJson });
            undoCommands.shift();
        }
    } else if (command == "cutComponents") {
        if (isRedo == true) {
            updateSchemas();
            lastCommand[command]["schema"] = schemasAliases[
                lastCommand[command]["schema"]
            ]
                ? schemasAliases[lastCommand[command]["schema"]]
                : lastCommand[command]["schema"];
            removeComponents(
                lastCommand[command]["schema"],
                true,
                lastCommand[command]["divIds"]
            );
            redoCommands.shift();
        } else {
            var divIds = [];
            var componentsObj = lastCommand[command];

            for (var comp in componentsObj) {
                if (typeof componentsObj[comp] == "object") {
                    divIds.push(
                        componentsObj[comp]["component_info"]["div_id"]
                    );
                    createLoadedComponent(
                        componentsObj[comp]["component_info"],
                        appSchema
                    );
                    for (
                        var iConn = 0;
                        iConn < componentsObj[comp]["connections"].length;
                        iConn++
                    ) {
                        newDivIdSource =
                            componentsObj[comp]["connections"][iConn][
                                "source_id"
                            ];
                        newDivIdTarget =
                            componentsObj[comp]["connections"][iConn][
                                "target_id"
                            ];
                        if (
                            document.getElementById(newDivIdSource) &&
                            document.getElementById(newDivIdTarget)
                        ) {
                            if (
                                newDivIdSource != undefined &&
                                newDivIdTarget != undefined
                            ) {
                                source = newDivIdSource + "_0";
                                target = newDivIdTarget + "_1";
                                j.connect({ uuids: [source, target] });
                            }
                        }
                    }
                }
            }
            if (redoCommands.length == 5) redoCommands.pop();

            var redoJson = {};
            redoJson["divIds"] = divIds;
            redoJson["schema"] = appSchema;
            redoCommands.unshift({ cutComponents: redoJson });
            undoCommands.shift();
        }
    } else if (command == "pasteComponents") {
        if (isRedo == true) {
            pasteComponents(appSchema_, true, lastCommand[command]);
            redoCommands.shift();
        } else {
            var redoJson = {};
            redoJson["div_ids"] = [];
            redoJson["connections"] = [];
            for (var comp in lastCommand[command]["components"]) {
                menuId =
                    "wrapper_menu_" +
                    lastCommand[command]["components"][comp]["div_id"];
                redoJson["div_ids"].push(
                    lastCommand[command]["components"][comp]["div_id"]
                );
                removeComponent(
                    menuId,
                    lastCommand[command]["components"][comp]["div_id"],
                    appSchema,
                    true
                );
            }
            for (var con in lastCommand[command]["connections"]) {
                redoJson["connections"].push(
                    lastCommand[command]["connections"][con]
                );
            }
            redoJson["json"] = lastCommand[command]["oldJson"];
            redoJson["schema"] = appSchema;
            if (redoCommands.length == 5) redoCommands.pop();

            redoCommands.unshift({ pasteComponents: redoJson });
            undoCommands.shift();
        }
    }

    updateSchemas(); //Atualiza os schemas a cada undo/redo
}
