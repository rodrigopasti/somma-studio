/*
Faz o controle de acesso de toda a aplicação e seus JSONs
*/

var currentApplication = null; //Armazena aplicação corrente aberta
//JSONs
var componentsTemplates = {}; //Template de componentes (independente da aplicação)
var schemas = {}; //Schemas da aplicação corrente
//var schemasAliases = {}; //Nomes de schemas modificados para recuperar nomes de schemas originais e vice e versa
var requests = {}; //Requisições na aplicação corrente
var applicationsInfo = {}; //Definição de todas as aplicações do usuário
var sharedApplicationsInfo = {};
var applicationJSONs = {}; //Retorno do carregamento da aplicação: schemas e requests
var nativeComponents; //Lista com os componentes que são nativos
var validRequiredParameters = {};
var isValidSchemas = {};
var isValidApplication = true;
var jsonAppStatus = {};
var hasApplicationOpened = false;

/*
Gerencia mensagens para o usuário no header do Studio
*/
function messagesLog(message) {
    showMessageBar(message);
}

/*
Faz a requisição para a execução de uma aplicação
*/
function runApplicationRequisition(
    selectedSchema,
    selectedtState,
    selectedPlan,
    app_id,
    schemaName,
    instanceId,
    hasWebApi
) {
    //Antes de rodar, salvar a aplicação para garantir consistência nos schemas
    //saveApplication();

    runJSON = {};
    runJSON["app"] = currentApplication;
    runJSON["schema"] = selectedSchema;
    runJSON["state"] = selectedtState;
    runJSON["plan"] = selectedPlan;
    runJSON["app_id"] = app_id;
    runJSON["hasWebApi"] = hasWebApi;

    if (instanceId) {
        runJSON["instance_id"] = instanceId;
    }

    runJSONStr = JSON.stringify(runJSON);

    errorMessages = {
        "Max Execution Limit":
            "Your limit of simultaneous executions has been exceeded, please try again after the execution of the other application is finished",
        "Plan Not Allowed":
            "You are trying to run with a plan that you're not authorized",
        "No Resource Capacity":
            "Community machine don't have resources in the moment, please try again in few minutes",
        "Database Limit Exceeded":
            "Your database limit was exceeded, please clean some datasets and run again",
        "Machine Booting":
            "Your machine is still starting, it can take up to 3 minutes to be ready",
        "No Machine":
            "This machine is not available, it may have been turned off or you are not authorized to use it",
        "Machine Occupied": "There is already an execution on that machine",
    };

    $.ajax({
        url: "/run-application?" + runJSONStr,
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "text",
        data: runJSONStr,
        success: function (data) {
            if (data == "application requested to run") {
                getApplicationStatus(app_id, schemaName);
            } else {
                stopApp(schemaName);
                endAppFlag[selectedSchema] = true;
                schemaLogger(errorMessages[data], schemaName, false, "error");
                schemaLogger(
                    "Execution error (" + data + ")",
                    schemaName,
                    true,
                    "error"
                );
                messagesLog(data);
                runningApp[selectedSchema] = false;
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
        },
    });
}

/*
Faz a requisição de PARAR a execução de uma aplicação
*/
function stopApplicationRequisition(selectedSchema) {
    runJSON = {};
    runJSON["app"] = currentApplication;
    runJSON["schema"] = selectedSchema;

    runJSONStr = JSON.stringify(runJSON);
    $.ajax({
        url: "/stop-application?" + runJSONStr,
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "json",
        data: runJSONStr,
        success: function (data) {
            if (data["msg"] == "application stopped") {
                selectedSchema = data["schema"];
                selectedSchema =
                    selectedSchema in schemasAliases
                        ? schemasAliases[selectedSchema]
                        : selectedSchema;
                stopApp(selectedSchema);
                messagesLog("Application stopped");
                schemaLogger(
                    "Application Stopped by User",
                    selectedSchema,
                    true,
                    "message"
                );
                endAppFlag[selectedSchema] = true;
                runningApp[selectedSchema] = false;
            } else if (
                data["msg"] != "Application finished before stop requisition"
            ) {
                selectedSchema = data["schema"];
                selectedSchema =
                    selectedSchema in schemasAliases
                        ? schemasAliases[selectedSchema]
                        : selectedSchema;
                stopApp(selectedSchema);
                messagesLog(data["msg"]);
                schemaLogger(data["msg"], selectedSchema, true, "message");
                endAppFlag[selectedSchema] = true;
                runningApp[selectedSchema] = false;
            }
        },
    });
}

/*
Método que abre uma aplicação existente
*/
function openApplication(applicationInfo, isClone) {
    // document.getElementById("no_applications_msg").style.display = "none";
    if (document.getElementById("amb-cnf-embedded-container-1")) {
        document.getElementById("amb-cnf-embedded-container-1").style.bottom =
            "22px";
    }
    if (isClone) {
        var appInfo = Object.keys(applicationInfo);
        currentApplication = appInfo[0];
    } else {
        currentApplication = applicationInfo["application_name"];
    }
    //Reiniciar os schemas se tiver algum
    if (Object.keys(schemas).length > 0) {
        resetSchemas(schemas); //Função de render block
    }
    schemas = {};
    requests = {};
    applicationJSONs = {};
    //Pegar a seleção atual de aplicação
    //var applicationInfo = JSON.stringify(applicationInfo);
    //Abrir a aplicação

    $.ajax({
        url: "/load-application",
        type: "GET",
        data: { application_name: currentApplication },
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        beforeSend: function () {
            document.getElementById("screen-app-loader-app").style.display =
                "block";
        },
        success: function (data) {
            hasApplicationOpened = true;
            applicationJSONs = data;
            document.getElementById("dropdown_arrow").style.transform = "none";
            $("#applications_dropdown").fadeOut(300);
            $("#welcome_step_1").fadeOut();
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            // document.getElementById("label_app_name").style.display =
            //     "inline-block";
            // document.getElementById(
            //     "label_app_name"
            // ).textContent = currentApplication;
            document.getElementById("buttons").style.display = "flex";
            // document.getElementById("schema_navigation").style.display = "block";
            document.getElementById("schema_navigation_wrapper").style.display =
                "block";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.pointerEvents = "all";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.cursor = "pointer";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.opacity = "1";
            // document.getElementById("slider-menu").style.display = "block";
            closeModals();
            schemas = applicationJSONs["studio_schemas"];

            //requests = applicationJSONs["requests"];
            //schemasAliases = applicationJSONs["schemas_aliases"];

            //Gera a aplicação: renderiza componentes, ligações e parâmetros dos componentes
            generateSchemas(schemas, schemasAliases); //Função de render block
            nextAppSteps("step_2");
            messagesLog("Application was opened");
            [jsonAppStatus, isValidSchemas, isValidApplication] =
                checkApplication(); //Função de applicationAnalysis
            setWindowAnalysis(jsonAppStatus, isValidApplication);

            var schemasName = Object.keys(applicationJSONs["studio_schemas"]);
            for (var s in schemasName) {
                var comps =
                    applicationJSONs["studio_schemas"][schemasName[s]][
                        "components"
                    ];
                for (var c in comps) {
                    if (
                        comps[c]["div_id"].split("-xx-")[0] ==
                        "Deep Neural Network"
                    ) {
                        // console.log(comps[c]["parameters"]["name"] + ": " + comps[c]["parameters"]["layers"]);
                        var idNameComp = "DeepNeuralNetwork";
                        var divIdIndexComp =
                            comps[c]["div_id"].split("-xx-")[1];
                        var idCanvas =
                            "canvas_nn_" +
                            comps[c]["div_id"].replace(/\s/g, "");
                        jsonLayersSchemaStr = document.getElementById(
                            "nn_schema_" +
                                idNameComp +
                                "-xx-" +
                                divIdIndexComp +
                                "-xx-" +
                                idCanvas.split("-xx-")[1]
                        ).value;
                        jsonLayers = JSON.parse(jsonLayersSchemaStr);
                        generateNN(jsonLayers, idCanvas);
                    }
                }
            }
        },
    });
}

function generateSchemaByPrompt(appSchema, componentId, left, top) {
    let userPrompt = document.getElementById("input_schema_gpt").value;

    document.getElementById("screen-app-loader-app").style.display = "block";
    const obj = {
        prompt: userPrompt,
    };
    if (componentId && componentId !== "undefined")
        obj["component_id"] = componentId;

    $.ajax({
        url: "/generate-prompt-schema",
        data: obj,
        type: "POST",
        dataType: "json",
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        error: function (e) {
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            messagesLog("Unkown error");
        },
        success: function (data) {
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            handlePromptSchema(data, appSchema, componentId, left, top);
        },
    });
}
function updateInfo(applicationName) {
    var applcationName = document.getElementById(
        "input_application_name"
    ).value;
    var idNames = Object.keys(componentsTemplates);
    var arr = []; //Array para armazenar todos os id_names para comparar com os nomes dos schemas
    for (var i = 0; i < idNames.length; i++) {
        arr.push(componentsTemplates[idNames[i]]["id_name"]);
    }

    var appInfo = applicationsInfo[clickedApplication];
    appInfo["application_name"] = applcationName;
    var nameExists = false;
    var appNames = Object.keys(applicationsInfo);

    for (var name of appNames) {
        if (name == applcationName) {
            nameExists = true;
        }
    }
    if (
        verifyStringSize("application_name", appInfo["application_name"]) &&
        validateIntegrity(appInfo["application_name"]) &&
        verifyIfContainsIdName(
            appInfo["application_name"],
            arr,
            "Application name"
        )
    ) {
        if (nameExists == false) {
            $.ajax({
                url: "/rename-application",
                type: "POST",
                processData: false,
                contentType: false,
                dataType: "text",
                data: JSON.stringify({
                    oldName: clickedApplication,
                    newName: appInfo["application_name"],
                }),
                beforeSend: function () {
                    document.getElementById(
                        "screen-app-loader-app"
                    ).style.display = "block";
                },
                success: function () {
                    delete applicationsInfo[clickedApplication];
                    document.getElementById(
                        "app___" + clickedApplication
                    ).innerHTML = appInfo["application_name"];
                    document
                        .getElementById("app___" + clickedApplication)
                        .setAttribute(
                            "onclick",
                            "renderApplicationInfo('" +
                                appInfo["application_name"] +
                                "', false);"
                        );
                    document.getElementById(
                        "app___" + clickedApplication
                    ).title = appInfo["application_name"];
                    document.getElementById("app___" + clickedApplication).id =
                        "app___" + appInfo["application_name"];
                    if (clickedApplication == currentApplication) {
                        currentApplication = appInfo["application_name"];
                    }
                    applicationsInfo[appInfo["application_name"]] = appInfo;

                    $.ajax({
                        url: "/create-application",
                        type: "POST",
                        processData: false,
                        contentType: false,
                        dataType: "text",
                        data: JSON.stringify(appInfo),
                        success: function () {
                            // document.getElementById(
                            //     "btn_open_app"
                            // ).disabled = false;
                            // document.getElementById(
                            //     "btn_delete_app"
                            // ).disabled = false;
                            // document.getElementById(
                            //     "label_app_name"
                            // ).style.display = "inline-block";
                            // document.getElementById(
                            //     "label_app_name"
                            // ).textContent = appInfo["application_name"];
                            clickedApplication = appInfo["application_name"];
                            messagesLog("Application info updated");
                            document.getElementById(
                                "screen-app-loader-app"
                            ).style.display = "none";
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr);
                            document.getElementById(
                                "btn_open_app"
                            ).disabled = false;
                            document.getElementById(
                                "btn_delete_app"
                            ).disabled = false;
                            messagesLog(xhr.responseText);
                            document.getElementById(
                                "screen-app-loader-app"
                            ).style.display = "none";
                        },
                    });
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log(xhr);
                    document.getElementById("btn_open_app").disabled = false;
                    document.getElementById("btn_delete_app").disabled = false;
                    messagesLog(xhr.responseText);
                    document.getElementById(
                        "screen-app-loader-app"
                    ).style.display = "none";
                },
            });
        } else {
            alert("Application name duplicated");
        }
    }
    //if (appInfo["application_name"] != currentApplication) {

    //}
}

/*
Cria uma nova aplicação recebendo o JSON de informações
*/
function createOpenApplication(newAppInfo) {
    currentApplication = newAppInfo["application_name"];
    applicationsInfo[currentApplication] = newAppInfo;
    //Reiniciar os schemas se tiver algum
    if (Object.keys(schemas).length > 0) {
        resetSchemas(schemas); //Função de render block
    }

    schemas = {};
    requests = {};
    applicationJSONs = {};
    //Cria todas as pastas e salva arquivo de informações da aplicação
    var newAppInfo = JSON.stringify(newAppInfo);
    document.getElementById("screen-app-loader-app").style.display = "block";

    $.ajax({
        url: "/create-application",
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "text",
        data: newAppInfo,
        success: function () {
            $("#applications_dropdown").fadeOut(300)
            document.getElementById("screen-app-loader-app").style.display = 'none'
            hasApplicationOpened = true;
            var newAppItem = document.createElement("li");
            newAppItem.setAttribute("id", "app___" + currentApplication);
            newAppItem.setAttribute("class", "application_item");

            newAppItem.setAttribute(
                "onclick",
                "renderApplicationInfo(currentApplication, false)"
            );
            newAppItem.click();
            newAppItem.textContent = currentApplication;

            document
                .getElementById("applications_list")
                .appendChild(newAppItem);
            document.getElementById("schema_navigation_wrapper").style.display =
                "block";
            document.getElementById("buttons").style.display = "block";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.pointerEvents = "all";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.cursor = "pointer";
            document.getElementById(
                "sidebar_components_menu_option"
            ).style.opacity = "1";
            nextAppSteps("step_2");

            // document.getElementById("slider-menu").style.display = "block"
            //Gera 1 novo schema
            newSchema(); //Função de Render Block
            //messagesLog("New application created");
            saveApplication(null, true); //Salva os demais dados da aplicação criada
        },
        error: function (xhr, ajaxOptions, thrownError) {
            document.getElementById("screen-app-loader-app").style.display = 'none'

            messagesLog(xhr.responseText);
        },
    });
}

/*
Apaga uma aplicação recebendo o JSON de informações
*/
function deleteApplication(applicationName) {
    //Se a aplicação a ser excluida, for a corrente, resetar schemas
    // e fechar todos os elementos do canvas
    if (currentApplication == applicationName) {
        hasApplicationOpened = false;
        // document.getElementById("no_applications_msg").style.display = "block";
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.pointerEvents = "none";
        document.getElementById("sidebar_components_menu_option").style.cursor =
            "default";
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.opacity = "0.5";
        resetSchemas(schemas);
        //Menu de componentes / menuClosed -> componentsMenu.js
        if (menuClosed == false) {
            openCloseMenu(); //Menu de componentes
        }

        // document.getElementById("label_app_name").textContent = "No Open Application";
        document.getElementById("buttons").style.display = "none";
        document.getElementById("schema_navigation_wrapper").style.display =
            "none";
        // document.getElementById("slider-menu").style.display = "none";
        schemas = {};
        currentApplication = "";
    }
    //Apagar a aplicação
    $.ajax({
        url: "/delete-application",
        data: { application_name: applicationName },
        type: "GET",
        dataType: "json",
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        beforeSend: function () {
            document.getElementById("screen-app-loader-app").style.display =
                "block";
        },
        success: function (data) {
            messagesLog("Application deleted")
            document.getElementById("application_info").style.display = 'none'
            // document.getElementById("label_app_name").style.display = "none";
            // $("#applications_list li").remove();
            // $("#app___" + applicationName).remove();
            $("[id='app___" + applicationName + "']").remove();
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            applicationJSONs = data;
        },
    });
}

/*
Apaga uma aplicação compartilhada recebendo o JSON de informações
*/
function deleteSharedApplication(applicationName) {
    //Apagar a aplicação
    $.ajax({
        url: "/delete-application",
        data: {
            application_name: applicationName,
            type: "workspace",
            workspace: "default",
        },
        type: "GET",
        dataType: "json",
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        beforeSend: function () {
            document.getElementById("screen-app-loader-app").style.display =
                "block";
        },
        success: function (data) {
            document.getElementById("shared_application_info").style.display = 'none'

            document.getElementById("screen-app-loader-app").style.display =
                "none";
            $("[id='shared_app___" + applicationName + "']").remove();

            renderSharedApplicationNames();
            applicationJSONs = data;
        },
    });
}

/*
READ METHODS
Faz a leitura dos JSONs da aplicação
*/

/*
Fazendo a leitura dos templates dos componentes
*/

function readComponentsTemplates() {
    $.ajax({
        url: "/load-components-templates",
        type: "GET",
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            componentsTemplates = data;
            nativeComponents = Object.keys(componentsTemplates);
            renderComponentHelp(); //Vindo de componentsMenu.js: assim que carrega template,
            //renderiza o help no menu de componentes
        },
    });
}

function readComponentsAliases() {
    $.ajax({
        url: "/load-components-aliases",
        type: "GET",
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            componentsAliases = data;
        },
    });
}

function readParametersAliases() {
    $.ajax({
        url: "/load-parameters-aliases",
        type: "GET",
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            // console.log(data);

            parametersAliases = data;
        },
    });
}
/*
Fazendo a leitura dos templates dos layers de redes neurais
*/

function readLayersTemplates() {
    $.ajax({
        url: "/load-layers-templates",
        type: "GET",
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            layersTemplate = data;
        },
    });
}

//Leitura de aplicações compartilhadas
function readSharedApplications(isReload) {
    var async = true;
    if (isReload) {
        async = false;
    }
    $.ajax({
        url: "/applications",
        type: "GET",
        data: { type: "workspace", workspace: "default" },
        dataType: "json",
        async: async,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            sharedApplicationsInfo = data;
        },
    });
    document.getElementById("screen-app-loader-app").style.display = "none";
}

//Função para compartilhar uma aplicação
function shareApplication() {
    //Tratativa em caso do usuário alterar e salvar o nome da aplicação
    applicationName = clickedApplication;

    if (confirm("Share " + applicationName + "?")) {
        document.getElementById("screen-app-loader-app").style.display =
            "block";
        $.ajax({
            url: "/upload-application",
            type: "POST",
            data: { workspace: "default", app_name: applicationName },
            dataType: "json",
            async: true,
            statusCode: {
                404: function () {
                    console.log("page not found");
                },
            },
            success: function (data) {
                document.getElementById("screen-app-loader-app").style.display =
                    "none";
                messagesLog("Application shared");
            },
        });
    }
}

function cloneApplication() {
    let application_name = clickedApplication;
    document.getElementById("screen-app-loader-app").style.display = "block";
    $.ajax({
        url: "/clone-application",
        type: "GET",
        data: { workspace: "default", app_name: application_name },
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            if (data) {
                appendClonedApplication(data);
                messagesLog("Application cloned and added to your workspace");
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            messagesLog(xhr.responseJSON.message);
        },
    });
}

function cloneOpen() {
    application_name = clickedApplication;
    document.getElementById("screen-app-loader-app").style.display = "block";
    $.ajax({
        url: "/clone-application",
        type: "GET",
        data: { workspace: "default", app_name: application_name },
        dataType: "json",
        async: true,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            if (data) {
                appendClonedApplication(data);
                document.getElementById("screen-app-loader-app").style.display =
                    "none";
                messagesLog("Application cloned and added to your workspace");
                openApplication(data, true);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            document.getElementById("screen-app-loader-app").style.display =
                "none";
            messagesLog(xhr.responseJSON.message);
        },
    });
}

/*
Faz a leitura das aplicações existentes do usuário e seu JSON de definição
*/
function readApplications(isReload) {
    //Verificando, caso esta função seja chamada para reload a função será síncrona. Caso contrário assíncrona (como já estava)
    var async = true;
    if (isReload) {
        async = false;
    }

    $.ajax({
        url: "/applications",
        type: "GET",
        data: { type: "user" },
        dataType: "json",
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            $("#my_account_btn").click(function () {
                openTab(event, "my_account_def_tab");
                modal_applications.style.display = "block";
                document.getElementById(
                    "window_my_account_content"
                ).style.display = "block";
                document.getElementById("window_app_content").style.display =
                    "none";
            });

            $("#loader-app").prop("class", "hide-loader");
            // Ao clicar para a abrir mostrar modal, ler os JSONSs e renderizar os nomes das aplicações
            $("#applications_btn").click(function () {
                openTab(event, "application_def_tab");
                document.getElementById(
                    "window_my_account_content"
                ).style.display = "none";
                document.getElementById("window_app_content").style.display =
                    "block";
                closeCurrentTab("datasets"); //Fecha a tela de datasets, caso esteja aberta
                openApplicationTab();
                updateSchemas(); //Função de render block
                //getApplicationsJSONS();
                modal_applications.style.display = "block";
                document.getElementById("window_app_container").style.display =
                    "block";
                var isChrome =
                    !!window.chrome &&
                    (!!window.chrome.webstore || !!window.chrome.runtime);

                app_names = document.getElementById("applications_names");

                if (isChrome) {
                    app_names.style.display = "-webkit-inline-box";
                } else {
                    app_names.style.display = "inline-block";
                }

                document.getElementById("application_def_tab").style.display =
                    "block";
                //document.getElementById('application_def_tab').style.display = "block";
                document.getElementById("application_def_button").className +=
                    " active";
                renderApplicationNames();
                try {
                    document.getElementById("checkbox_markdown").checked = true;
                    // Sleep para o readme não aparecer enquanto o modal está descendo
                    sleep(300).then(() => {
                        document.getElementById("readme_div").style.display =
                            "inline-block";
                    });
                } catch {}
            });
            applicationsInfo = data;
        },
    });
}

function getComponentModels(componentName, applicationName) {
    data = {};
    data["component_name"] = componentName;
    data["application_name"] = applicationName;
    data = JSON.stringify(data);
    var response;
    $.ajax({
        url: "/get-models",
        type: "GET",
        processData: false,
        contentType: false,
        dataType: "json",
        data: data,
        async: false,
        success: function (data) {
            // console.log(data)
            response = data;
        },
    });
    return response;
}

// Função para verificar se components com modelos foram excluídos, se sim irá apagar os modelos no BD

function handleModelsComponent(oldSchemas, applicationName) {
    // schemas = getSchemas()
    let componentsWithModels = [];
    let componentsToBeDeleted = [];
    for (let component in componentsTemplates) {
        if (componentsTemplates[component]["component_type"] == "model") {
            componentsWithModels.push(component);
        }
    }

    for (let schema in oldSchemas) {
        for (let comp in oldSchemas[schema]["components"]) {
            let component = oldSchemas[schema]["components"][comp];
            let stillExists = false;

            if (
                componentsWithModels.includes(
                    component["parameters"]["id_name"]
                )
            ) {
                let compName = component["parameters"]["name"];
                for (let newSchema in schemas) {
                    _.find(schemas[newSchema]["components"], function (item) {
                        if (item["parameters"]["name"] == compName) {
                            stillExists = true;
                            return stillExists;
                        }
                    });
                    if (stillExists == true) break;
                }
                if (!stillExists) {
                    componentsToBeDeleted.push(compName);
                }
            }
        }
    }
    for (component of componentsToBeDeleted) {
        models = getComponentModels(component, applicationName);
        if (!_.isEmpty(models)) {
            let compKey = Object.keys(models);
            let ids = [];
            let modelsArr = models[compKey];
            for (model of modelsArr) {
                ids.push(model["model_id"]);
            }
            deleteComponentsModels(ids, applicationName);
        }
    }
}
/*
SAVE METHODS
*/

/*
Salva aplicação toda (requests + schemas)
*/

function saveApplication(schemaName, createOpen) {
    let oldSchemas = getSchemas();
    var idNames = Object.keys(componentsTemplates);
    var arr = []; //Array para armazenar todos os id_names para comparar com os nomes dos schemas
    for (var i = 0; i < idNames.length; i++) {
        arr.push(componentsTemplates[idNames[i]]["id_name"]);
    }
    var isRunning;
    if (document.getElementById("running_" + schemaName)) {
        document.getElementById("running_" + schemaName).style.display ==
        "inline-block"
            ? (isRunning = true)
            : (isRunning = false);
    }
    $(document.getElementById("run_" + schemaName)).css(
        "pointer-events",
        "none"
    );
    if (document.getElementById("run_" + schemaName) != null) {
        document.getElementById("run_" + schemaName).style.opacity = 0.1;
    }

    //Captura ultima mudança feita nos schemas
    updateSchemas(); //Função de renderBlock
    handleModelsComponent(oldSchemas, currentApplication);

    [jsonAppStatus, isValidSchemas, isValidApplication] = checkApplication(); //Função de applicationAnalysis
    setWindowAnalysis(jsonAppStatus, isValidApplication);

    createOpen ? null : restartComponents(schemaName);

    applicationJSONs = {};
    applicationJSONs["studio_schemas"] = schemas;
    var schemasName = Object.keys(applicationJSONs["studio_schemas"]);
    var isValidSchemaName = true;
    for (var i = 0; i < schemasName.length; i++) {
        if (
            !verifyStringSize("schema_name", schemasName[i]) ||
            !verifyIfContainsIdName(schemasName[i], arr, "Schema name") ||
            !validateIntegrity(schemasName[i])
        ) {
            isValidSchemaName = false;
        }
    }
    //applicationJSONs["schemas_aliases"] = schemasAliases
    //applicationJSONs["requests"] = requests
    applicationJSONs["info"] = applicationsInfo[currentApplication];
    isValidSchemaName == true
        ? postApplicationJSONs(
              applicationJSONs,
              schemaName,
              isRunning,
              createOpen
          )
        : null;
    undoCommands = [];
    redoCommands = [];
}

/*
Salva os modelos que o usuário selecionar na tela
*/
function saveComponentsModels(models_ids, componentName, applicationName) {
    data = {};
    data["models_ids"] = models_ids;
    data["component_name"] = componentName;
    data["application_name"] = applicationName;

    data = JSON.stringify(data);
    $.ajax({
        url: "/save-selected-models",
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "json",
        data: data,
        success: function () {
            messagesLog("Selected models updated successfuly");
            // console.log(data);
        },
    });
}

function deleteComponentsModels(models_ids, applicationName, buttonId) {
    $.ajax({
        url: "/delete-selected-models",
        type: "GET",
        dataType: "json",
        data: { models_ids: models_ids, application_name: applicationName },
        success: function () {
            messagesLog("Selected models deleted successfuly");
            document.getElementById(buttonId).style.display = "none";
            // console.log(data);
        },
    });
}
/*
Salva os schemas (studio + core)
*/
function postApplicationJSONs(
    applicationJSONs,
    schemaName,
    isRunning,
    createOpen
) {
    //schemas = jsonSchemas;
    //var jsonSchemas = JSON.stringify(schemas);

    //Tratando lista dos esquemas com erros
    var schemasWithErrors_ = [];
    for (var i = 0; i < schemasWithErrors.length; i++) {
        for (var j = 0; j < schemasWithErrors[i].length; j++) {
            schemasWithErrors_.push(" " + schemasWithErrors[i][j]);
        }
    }
    var applicationJSONsStr = JSON.stringify(applicationJSONs);
    $.ajax({
        url: "/save-application",
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "text",
        data: applicationJSONsStr,
        success: function () {
            if (isValidApplication == false && !createOpen) {
                messagesLog(
                    "Application updated on server, but there are errors in" +
                        schemasWithErrors_
                );
            } else {
                messagesLog("Application updated on server");
            }
            if (!isRunning) {
                $(document.getElementById("run_" + schemaName)).css(
                    "pointer-events",
                    "auto"
                );
                if (document.getElementById("run_" + schemaName) != null) {
                    document.getElementById(
                        "run_" + schemaName
                    ).style.opacity = 1;
                }
            }
        },
        error: function (xhr, _, _) {
            if (xhr.responseText.length > 0) {
                messagesLog(xhr.responseText);
            } else {
                messagesLog("Application update failed on server");
            }
            if (!isRunning) {
                $(document.getElementById("run_" + schemaName)).css(
                    "pointer-events",
                    "auto"
                );
                if (document.getElementById("run_" + schemaName) != null) {
                    document.getElementById(
                        "run_" + schemaName
                    ).style.opacity = 1;
                }
            }
        },
    });
}

/*
GETS AND SETS
*/
function setCurrentApplication(newCurrentApplication) {
    currentApplication = newCurrentApplication;
}

function setSchemas(newSchemas, newSchemasAliases) {
    schemas = newSchemas;
    schemasAliases = newSchemasAliases;
}

function setRequests(newRequests) {
    requests = newRequests;
}

function setApplicationsInfo(newApplicationsInfo) {
    applicationsInfo = newApplicationsInfo;
}

function setValidApplication(newValue) {
    schemasRP = Object.keys(newValidRequiredParameters);
    isValidApplication = true;
    for (i = 0; i < schemasRP.length; i++) {
        if (newValue[schemasRP[i]] > 0) {
            isValidSchemas[schemasRP[i]] = false;
            isValidApplication = false;
        } else {
            isValidSchemas[schemasRP[i]] = true;
        }
    }
    //validRequiredParameters = newValidRequiredParameters;
}

function getApplicationsInfo() {
    return applicationsInfo;
}

function getSharedApplicationsInfo() {
    return sharedApplicationsInfo;
}

function getIsValidSchemas() {
    return isValidSchemas;
}

function getSchemas() {
    return schemas;
}

function getRequests() {
    return requests;
}

function getComponentsTemplates() {
    return componentsTemplates;
}

/*
Função auxiliar para esperar um tempo em milisegundos
*/
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
