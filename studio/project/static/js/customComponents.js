/*
Controle de custom components. Arquivo custom_components.html
*/

/*
FunÃ§Ãµes de manipulaÃ§Ã£o dos components
*/
var componentsCount = 0;
var componentsJSON = {};
var schemas = {};
var schemasNames = [];
var currentCustomComponent = "";
var customComponents = {};
var customComponentsCode = {};
var config_template = {
    component_class: "",
    component_module: "",
    map_options: [],
    somma_data_types: ["spark_df"],
};
var template_template = {
    name: "",
    input_dim: 1,
    component_type: "",
    help: "",
};
var code_template =
    "'''\nCreated on \n\n@author: \n'''\n\nclass exampleClass(object):\n    \n    \n    def __init__(self, parameters):\n        '''\n        Constructor\n        '''\n        self.parameters = parameters\n\n    def input(self, data_objects, meta_data):\n\n        ### Your code here\n\n        return data_objects, meta_data";
ace.require("ace/ext/language_tools");

/*
FORMATO DE JSON PRINCIPAL
customComponetsJSON = {"component_1":{"config":{},"template":{}}}
*/

function openCustomComponents() {
    var modal_components = document.getElementById("modal_components");
    modal_components.style.display = "block";
    setFocus(false, modal_components.id);
}

function closeCustomComponents() {
    var modal_components = document.getElementById("modal_components");
    modal_components.style.display = "none";
}

/*
Inicializa custom components: faz a leitura dos cÃ³digos e templates
e gera janela
Primeiro passo faz a leitura dos cÃ³digos de modo a garantir a consistÃªncia
*/
function initializeCustomComponents() {
    //Leitura dos arquivos de cÃ³digo

    $.ajax({
        url: "/get-custom-code",
        type: "GET",
        dataType: "json",
        async: false,
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            customComponentsCode = data;
            loadComponents(); //Faz o carregamento da janela e conteÃºdo apÃ³s ler cÃ³digos
        },
    });
    //Carregando componentes custom

    //Ajustando estilo e UI da janela
    //Tornando a janela draggable e resizable

    resizeOptions = {
        handles: "all",
    };

    dragOptions = {
        cancel: "#components_tab",
        scroll: false,
        drag: function (event, ui) {
            var mainPageWidth =
                document.getElementById("main-page").clientWidth;
            var customComponentWidth =
                document.getElementById("modal_components").clientWidth;
            var mainPageHeight =
                document.getElementById("main-page").clientHeight;
            if (ui.position.top <= 0) {
                ui.position.top = 1;
            } else if (ui.position.left > mainPageWidth - 200) {
                ui.position.left = mainPageWidth - 200;
            } else if (
                ui.position.left <=
                -Math.abs(customComponentWidth) + 100
            ) {
                ui.position.left = -Math.abs(customComponentWidth) + 100;
            } else if (ui.position.top >= mainPageHeight - 100) {
                ui.position.top = mainPageHeight - 100;
            }
        },
    };
    $("#modal_components").draggable(dragOptions).resizable(resizeOptions);
}

function loadComponents() {
    //var data = []
    // Leitura dos JSONs
    data = $.getJSON($SCRIPT_ROOT + "/get-components").done(function (json) {
        for (var elem in json) {
            //delete json[elem]["template"]["id_name"]
            customComponents[json[elem]["name"]] = {
                config: json[elem]["config"],
                template: json[elem]["template"],
                hasFile: true,
                updateFile: false,
                fromDB: true,
                name: json[elem]["name"],
                oldName: json[elem]["name"],
                edited: false,
            };

            componentsTemplates[json[elem]["name"]] = json[elem]["template"];
            //Renderizando nome do componentes na janela
            addComponent(json[elem]["name"], false);
            //Adicionando component ao menu de components
            menu = document.getElementById("sub_menu_custom_components");
            var component = document.createElement("a");
            component.setAttribute("class", "menu_text_sub");
            component.setAttribute("href", "javascript:void(0)");
            component.setAttribute(
                "onclick",
                "createComponent('" + json[elem]["name"] + "', schema, 'none')"
            );
            component.setAttribute("id", "menu-" + json[elem]["name"]);
            component.setAttribute("draggable", "true");
            component.setAttribute("ondragstart", "dragComp(event)");
            //drag and drop
            component.setAttribute("draggable", "true");
            component.setAttribute("ondragstart", "dragComp(event)");
            component.textContent = json[elem]["name"];
            menu.appendChild(component);
        }

        let openAppButton = document.getElementById("action_open_button");
        openAppButton.style.opacity = "1";
        openAppButton.style.pointerEvents = "auto";
        openAppButton.style.cursor = "pointer";
    });
}

function verifyFile(file) {
    if ($(file).val().endsWith(".py")) {
        customComponents[$(file).attr("id").split("upload-")[1]].hasFile = true;
        customComponents[
            $(file).attr("id").split("upload-")[1]
        ].updateFile = true;

        var fileReader = new FileReader();
        fileReader.onload = function () {
            code = fileReader.result;
            customComponents[$(file).attr("id").split("upload-")[1]]["code"] =
                customComponentsCode[$(file).attr("id").split("upload-")[1]] =
                    code;
            customComponents[$(file).attr("id").split("upload-")[1]][
                "edited"
            ] = true;
            //editor.setValue("");
            //editor.insert(code);

            var editor = ace.edit("editor_" + currentCustomComponent);
            editor.setValue("");
            editor.insert(code);
        };
        fileReader.readAsText($(file).prop("files")[0]);
        $(file).val("");
    } else alert("The component must have a Python File");
}

function verifyCustomComponentChanges() {
    var isValidName = true;
    var clonedCustomComponents = clone(customComponents);
    $("#components_names td").each(function () {
        var currentName =
            customComponents[this.childNodes[1].title]["config"][
                "component_class"
            ];

        currentName = currentName.replace(/([a-z])([A-Z])/g, "$1 $2");
        currentName = currentName.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

        if (currentName != this.childNodes[1].title) {
            if (
                currentName in clonedCustomComponents ||
                verifyNewlyCreated(
                    clonedCustomComponents,
                    this.childNodes[1].title
                ) == false
            ) {
                messagesLog("Component name duplicated: " + currentName);
                isValidName = false;
            }

            if (currentName.length > 23) {
                messagesLog("Maximum characters exceeded: " + currentName);
                isValidName = false;
            }
            if (
                !verifyIfContainsIdName(currentName, nativeComponents, "Class")
            ) {
                isValidName = false;
            }
        }
    });
    return isValidName;
}

//FunÃ§Ã£o que verifica nomes iguals em um ou mais componentes criados no mesmo momento
function verifyNewlyCreated(customComponents, currentName) {
    var compClass = customComponents[currentName]["config"]["component_class"];
    for (var cc in customComponents) {
        if (currentName != cc) {
            if (
                compClass == customComponents[cc]["config"]["component_class"]
            ) {
                return false;
            }
        }
    }
    return true;
}
function saveComponents() {
    var isValidName = verifyCustomComponentChanges();

    if (isValidName == true) {
        if (currentCustomComponent != "") {
            //Tratando em casos de lista vazia
            map_options = [];
            somma_data_types = [];

            if (document.getElementById("map_options").value != "") {
                map_options = document
                    .getElementById("map_options")
                    .value.split(",");
                map_options = map_options.map(
                    Function.prototype.call,
                    String.prototype.trim
                );
            }

            if (document.getElementById("somma_data_types").value != "") {
                somma_data_types = document
                    .getElementById("somma_data_types")
                    .value.split(",");
                somma_data_types = somma_data_types.map(
                    Function.prototype.call,
                    String.prototype.trim
                );
            }

            customComponents[currentCustomComponent].config["map_options"] =
                map_options;
            customComponents[currentCustomComponent].config[
                "somma_data_types"
            ] = somma_data_types;
            customComponents[currentCustomComponent].template = JSON.parse(
                document.getElementById("template_textarea").value
            );
        }

        //Adicionando um nome e o id name caso nÃ£o exista (isso ocorre devido Ã  nÃ£o obrigatoriedade
        // do usuÃ¡rio definir um id_name ou name no template)
        comps = Object.keys(customComponents);

        for (iComp = 0; iComp < comps.length; iComp++) {
            var name =
                customComponents[comps[iComp]]["config"]["component_class"];
            name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
            name = name.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
            customComponents[comps[iComp]]["template"]["id_name"] = name;
            customComponents[comps[iComp]]["template"]["name"] = name;
            customComponents[comps[iComp]]["name"] = name;
        }

        if (currentCustomComponent != "") {
            saveCode(currentCustomComponent);
        }

        var files = true;
        for (var i in customComponents) {
            //if (!customComponents[i].hasFile){
            if (customComponents[i].code == "") {
                files = false;
                alert('The component "' + i + '" has no code');
                break;
            }
        }

        if (files) {
            /*var form = document.getElementById("upload-form")
      var json = document.createElement('input')
      json.setAttribute("type", "text")
      json.value = JSON.stringify(customComponents)
      json.setAttribute("id", "json")
      form.appendChild(json)*/
            var form = document.getElementById("upload-form");
            var input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("name", "component-json");
            input.setAttribute("id", "upload-json");
            input.value = JSON.stringify(customComponents);
            input.setAttribute("class", "upload-json");
            input.setAttribute("style", "display:none;");
            form.appendChild(input);
            //document.getElementById("upload-form").submit()
            //reloadDiv('/upload-components')
            var form_data = new FormData($("#upload-form")[0]);
            $.ajax({
                type: "POST",
                url: "/upload-components",
                data: form_data,
                contentType: false,
                cache: false,
                processData: false,
                success: function (data) {

                    menu = document.getElementById(
                        "sub_menu_custom_components"
                    );
                    $(menu)
                        .children()
                        .not(":first-child")
                        .not(":nth-child(2)")
                        .remove();
                    var oldKeys = [];

                    for (var i in customComponents) {
                        customComponents[i].fromDB = true;
                        customComponents[i].updateFile = false;
                        customComponents[i].edited = false;
                        customComponents[i].oldName =
                            customComponents[i]["name"];
                        componentsTemplates[customComponents[i]["name"]] =
                            customComponents[i]["template"];
                        document.getElementById("upload-" + i).value = "";
                        var component = document.createElement("a");
                        component.setAttribute("style", "display:block;");
                        component.setAttribute("class", "menu_text_sub");
                        component.setAttribute("href", "javascript:void(0)");

                        component.setAttribute(
                            "id",
                            "menu-" + customComponents[i]["name"]
                        );
                        component.setAttribute("draggable", "true");
                        component.setAttribute(
                            "ondragstart",
                            "dragComp(event)"
                        );
                        component.textContent = customComponents[i]["name"];
                        menu.appendChild(component);

                        if (i == currentCustomComponent) {
                            currentCustomComponent =
                                customComponents[i]["name"];
                        }

                        if (i != customComponents[i]["name"]) {
                            oldKeys.push(i);
                        }
                        customComponents[customComponents[i]["name"]] =
                            customComponents[i];
                        customComponentsCode[customComponents[i]["name"]] =
                            customComponentsCode[i];
                        component.setAttribute(
                            "onclick",
                            "createComponent('" +
                                customComponents[i]["name"] +
                                "', schema, 'none')"
                        );
                    }

                    for (var i in oldKeys) {
                        delete customComponents[oldKeys[i]];
                        delete customComponentsCode[oldKeys[i]];
                        document
                            .getElementById(
                                "editor_" + oldKeys[i].replace(/\s/g, "")
                            )
                            .remove();
                    }
                    updateCustomComponentName(customComponents);

                    messagesLog("Components saved");
                    [jsonAppStatus, isValidSchemas, isValidApplication] =
                        checkApplication(); //FunÃ§Ã£o de applicationAnalysis
                    setWindowAnalysis(jsonAppStatus, isValidApplication);
                },
                error: function (xhr) {
                    messagesLog(xhr.responseText);
                },
            });

            form.removeChild(input);
            input.remove();
        }
    }
}

function verifyClass(componentName) {
    for (component in customComponents) {
        className = customComponents[component]["config"]["component_class"];
        if (componentName.replace(/ /g, "") == className) return true;
    }

    return false;
}

/*
Adiciona um novo component na tabela e ao JSON de components
*/
function addComponent(newComponentName, isGPT) {
    config_template = {
        component_class: "",
        component_module: "",
        map_options: [],
        somma_data_types: ["spark_df"],
    };
    fromDB = true;
    if (newComponentName == "") {
        fromDB = false;
        do {
            componentsCount = componentsCount + 1;
            newComponentName = "New Component " + componentsCount;
        } while (
            newComponentName in customComponents ||
            verifyClass(newComponentName)
        );
        this_config_template = config_template;
        this_config_template["component_class"] = newComponentName.replace(
            / /g,
            ""
        );
        this_config_template["component_module"] = newComponentName
            .toLowerCase()
            .replace(/ /g, "_");
        customComponents[newComponentName] = {
            config: this_config_template,
            template: template_template,
            name: newComponentName,
            updateFile: false,
            edited: false,
            code: "",
        };
    }

    var componentsNamesTable = document.getElementById("components_names");
    var trtag = document.createElement("tr"); //Row
    var tdtag = document.createElement("td"); //Cell
    trtag.appendChild(tdtag);
    var atag = document.createElement("a"); //Elemento
    atag.setAttribute("href", "#");
    atag.setAttribute("class", "options_labels_link_cc");
    atag.setAttribute("title", newComponentName); //Utiliza title para armazenar informaÃ§Ã£o anterior
    atag.setAttribute("contenteditable", "false");
    atag.setAttribute(
        "onclick",
        "renderConfigParameters('" + newComponentName + "');"
    );
    atag.innerHTML = newComponentName;
    //Checkbox
    var checkBox = document.createElement("input");
    checkBox.setAttribute("type", "checkbox");
    checkBox.setAttribute("class", "options_checkbox_cc");
    checkBox.setAttribute("title", newComponentName);
    //checkBox.setAttribute("style", "background: green; border-color: #0e631f;");
    //checkBox.setAttribute("disabled", "true");
    //Append nas divs
    tdtag.appendChild(checkBox);
    tdtag.appendChild(atag);
    componentsNamesTable.appendChild(trtag);

    var form = document.getElementById("upload-form");
    var input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("name", "component-" + newComponentName);
    input.setAttribute("id", "upload-" + newComponentName);
    input.setAttribute("class", "upload-component");
    input.setAttribute("onchange", "verifyFile(this)");
    form.appendChild(input);

    //Adicionando ao JSON
    componentsJSON[newComponentName] = {};
    componentsJSON[newComponentName]["state"] = "none";
    componentsJSON[newComponentName]["components_parameters"] = {};
    // Quando Ã© novo pega por default o primeiro schema existente
    componentsJSON[newComponentName]["schema"] = schemasNames[0];
    createEditor(newComponentName, isGPT);

    if (isGPT) {
        messagesLog("Component created.");
        toggleOpenGPTPrompt();
        renderConfigParameters(newComponentName);

        saveComponents();
    }
}

/*
Apaga um component de acordo com a seleÃ§Ã£o de checkbox
*/
function deleteComponent() {
    //Para cada component verificar aqueles que estÃ£o com checkbox ativo
    deletedComponents = [];
    $("#components_names td").each(function () {
        if (this.childNodes[0].checked == true) {
            deletedComponents.push(this.childNodes[1].title);

            name = customComponents[this.childNodes[1].title].oldName;

            $.post($SCRIPT_ROOT + "/delete-component", { name: name }).done(
                function (json) {
                    if (json["success"]) {
                        let firstCC = document.getElementsByClassName(
                            "options_labels_link_cc"
                        )[0];
                        if (firstCC) firstCC.click();
                        //menu = document.getElementById("sub_menu_custom_components")
                        elem = document.getElementById("menu-" + json["name"]);
                        elem.remove();
                    }
                }
            );

            //Apagando JSON
            delete customComponents[this.childNodes[1].title];
            delete componentsJSON[this.childNodes[1].title];
            document
                .getElementById(
                    "editor_" + this.childNodes[1].title.replace(/\s/g, "")
                )
                .remove();
            //Eliminando elemento HTML (linha da tabela)
            this.remove();
        }
    });

    if (deletedComponents.indexOf(currentCustomComponent) >= 0) {
        document.getElementById("template_textarea").value = "";
        currentCustomComponent = "";
        //document.getElementById("module_name").style.display = "none";
    }
}

/*
Atualiza os nomes no menu lateral para o nome das classes dos customComponents
*/
function updateCustomComponentName(customComponents) {
    $("#components_names tr").each(function () {
        this.remove();
    });

    var componentsNamesTable = document.getElementById("components_names");
    for (var i in customComponents) {
        var trtag = document.createElement("tr"); //Row
        var tdtag = document.createElement("td"); //Cell
        trtag.appendChild(tdtag);
        var atag = document.createElement("a"); //Elemento
        atag.setAttribute("href", "#");
        atag.setAttribute("class", "options_labels_link_cc");
        atag.setAttribute("title", customComponents[i]["name"]); //Utiliza title para armazenar informaÃ§Ã£o anterior
        atag.setAttribute("contenteditable", "false");
        atag.setAttribute(
            "onclick",
            "renderConfigParameters('" + customComponents[i]["name"] + "')"
        );

        // atag.setAttribute("onclick", "renderConfigParameters('" + customComponents[i]["name"] + "', '" + clonedCustomComponents + "');");
        atag.innerHTML = customComponents[i]["name"];
        //Checkbox
        var checkBox = document.createElement("input");
        checkBox.setAttribute("type", "checkbox");
        checkBox.setAttribute("class", "options_checkbox_cc");
        checkBox.setAttribute("title", customComponents[i]["name"]);

        tdtag.appendChild(checkBox);
        tdtag.appendChild(atag);
        componentsNamesTable.appendChild(trtag);

        var form = document.getElementById("upload-form");
        var input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("name", "component-" + customComponents[i]["name"]);
        input.setAttribute("id", "upload-" + customComponents[i]["name"]);
        input.setAttribute("class", "upload-component");
        input.setAttribute("onchange", "verifyFile(this)");
        form.appendChild(input);

        createEditor(customComponents[i]["name"], false);
    }
    document.getElementById(
        "editor_" + currentCustomComponent.replace(/\s/g, "")
    ).style.display = "block";
}

const clone = (obj) => Object.assign({}, obj);

function editMode() {
    componentsLabelLinks = document.getElementsByClassName(
        "options_labels_link_cc"
    );
    componentsCheckbox = document.getElementsByClassName("options_checkbox_cc");
    if (componentsLabelLinks[0].contentEditable == "false") {
        for (var i = 0; i < componentsLabelLinks.length; i++) {
            $(componentsLabelLinks[i]).css("outline-style", "solid");
            $(componentsLabelLinks[i]).css("outline-color", "grey");
            $(componentsLabelLinks[i]).css("outline-width", "1px");
            componentsLabelLinks[i].contentEditable = "true";
        }
    } else {
        /*caso seja desejo fazer sumir os checkboxes
    for (var i = 0; i < componentsCheckbox.length; i++) {
      componentsCheckbox[i].checked = false;
      componentsCheckbox[i].disabled = true;
    }
    */
        for (var i = 0; i < componentsLabelLinks.length; i++) {
            $(componentsLabelLinks[i]).css("outline", "none");
            componentsLabelLinks[i].contentEditable = "false";
        }
        //Se mudou para o estado de desabilita ediÃ§Ã£o, verificar valores alterados
        //e alterar no JSON
        $("#components_names td").each(function () {
            if (this.childNodes[1].textContent != this.childNodes[1].title) {
                if (this.childNodes[1].textContent in customComponents) {
                    alert(
                        "Component name duplicated: " +
                            this.childNodes[1].textContent
                    );
                    this.childNodes[1].textContent = this.childNodes[1].title;
                }
                if (this.childNodes[1].textContent.length > 23) {
                    alert("Maximum characters exceeded");
                    this.childNodes[1].textContent = this.childNodes[1].title;
                } else {
                    customComponents[this.childNodes[1].textContent] =
                        customComponents[this.childNodes[1].title];
                    customComponents[this.childNodes[1].textContent].name =
                        this.childNodes[1].textContent;
                    componentsJSON[this.childNodes[1].textContent] =
                        componentsJSON[this.childNodes[1].title];
                    if (currentCustomComponent == this.childNodes[1].title) {
                        currentCustomComponent = this.childNodes[1].textContent;
                    }
                    document.getElementById(
                        "upload-" + this.childNodes[1].title
                    ).name = "component-" + this.childNodes[1].textContent;
                    document.getElementById(
                        "upload-" + this.childNodes[1].title
                    ).id = "upload-" + this.childNodes[1].textContent;

                    document.getElementById(
                        "editor_" + this.childNodes[1].title.replace(/\s/g, "")
                    ).id =
                        "editor_" +
                        this.childNodes[1].textContent.replace(/\s/g, "");

                    delete componentsJSON[this.childNodes[1].title];
                    delete customComponents[this.childNodes[1].title];
                    this.childNodes[1].title = this.childNodes[1].textContent; //Label link
                    this.childNodes[0].title = this.childNodes[1].textContent; //Check box
                    this.childNodes[1].setAttribute(
                        "onclick",
                        "renderConfigParameters('" +
                            this.childNodes[1].textContent +
                            "');"
                    );
                }
            }
        });
    }
}

function clearInput() {
    document.getElementById("gpt-prompt-input").value = "";
}

function toggleOpenGPTPrompt() {
    let promptWindow = document.getElementById("gpt-prompt-box");
    $(promptWindow)
        .draggable({ cancel: "#gpt-output, #gpt-prompt-input" })
        .resizable({ handles: "all" });

    if (promptWindow.style.display == "block") {
        promptWindow.style.display = "none";
    } else {
        let editor = ace.edit("gpt-output");
        editor.setTheme("ace/theme/monokai");
        editor.setOptions({
            fontSize: "14px",
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
        });
        editor.session.setMode("ace/mode/python");
        editor.setAutoScrollEditorIntoView(true);
        promptWindow.style.display = "block";
        promptWindow.click();
    }
}

function generateGPTPrompt() {
    let input = document.getElementById("gpt-prompt-input").value;
    ace.edit("gpt-output").setValue("");
    document.getElementById("spinner-prompt").style.display = "inline-block";

    $.ajax({
        url: "/generate-prompt",
        type: "POST",
        data: { input: input },
        statusCode: {
            404: function () {
                console.log("page not found");
            },
        },
        success: function (data) {
            var output = "";

            if (data["output"].indexOf("```python") !== -1) {
                var cleanText = data["output"].replace(/```python/g, "");
                cleanText = cleanText.replace(/```/g, "");
                output = cleanText;
            } else {
                output = data["output"];
            }

            if (data["max_prompt"] <= 0) {
                let sendBtn = document.getElementById("send-prompt-btn");
                sendBtn.style.pointerEvents = "none";
                sendBtn.style.opacity = "0.5";
                messagesLog("Exceed max_prompt use");
            }
            let max_prompt = data["max_prompt"] ? data["max_prompt"] : 0;
            document.getElementById("prompt-counter").textContent =
                max_prompt + " prompts remaining";
            document.getElementById("spinner-prompt").style.display = "none";
            // document.getElementById("gpt-output").value = data['output']
            ace.edit("gpt-output").insert(output);
            document.getElementById(
                "create-gpt-component-button"
            ).style.opacity = "unset";
            document.getElementById(
                "create-gpt-component-button"
            ).style.pointerEvents = "auto";
        },
    });
}

/*-------------------------------*/

/*
Renderiza todas as tabelas baseado na seleÃ§Ã£o do componente
*/
var this_config;
function renderConfigParameters(componentName) {
    if (currentCustomComponent != "") {
        try {
            customComponents[currentCustomComponent].config = this_config;
            document.getElementById("map_options").value =
                customComponents[currentCustomComponent].config["map_options"];
            document.getElementById("somma_data_types").value =
                customComponents[currentCustomComponent].config[
                    "somma_data_types"
                ];
        } catch (e) {
            alert("JSON error on Component Config");
            return false;
        }
        try {
            customComponents[currentCustomComponent].template = JSON.parse(
                document.getElementById("template_textarea").value
            );
        } catch (e) {
            alert("JSON error on Component Template");
            return false;
        }
        saveCode(currentCustomComponent);
        //document.getElementById("editor_" + currentCustomComponent).style.display = "none";
        document.getElementById("box_component_code").style.display =
            "inline-block";
        //Esconder editor anterior
        document.getElementById(
            "editor_" + currentCustomComponent.replace(/\s/g, "")
        ).style.display = "none";
    }
    //Reiniciar elementos de ediÃ§Ã£o de componente

    currentCustomComponent = componentName;
    document.getElementById(
        "editor_" + currentCustomComponent.replace(/\s/g, "")
    ).style.display = "block";
    document.getElementById("map_options").value =
        customComponents[componentName].config["map_options"];
    document.getElementById("somma_data_types").value =
        customComponents[componentName].config["somma_data_types"];
    this_config = customComponents[componentName].config;

    document.getElementById("template_textarea").value = JSON.stringify(
        customComponents[componentName].template,
        null,
        2
    );
    ace.edit("editor_" + componentName.replace(/\s/g, ""));

    //Reiniciar elementos de ediÃ§Ã£o de componente

    document.getElementById("switch_slide_code").style.display = "block";
    document.getElementById("module_name").style.display = "block";
    switchCodeConfig();
    renderCode(componentName);
}

/*-------------------------------*/

function resizeEditor() {
    var newHeight = $("#box_component_code").css("height");
    var editor = $("#editor_" + currentCustomComponent.replace(/\s/g, ""));
    editor.css("height", newHeight).css("opacity", 1);
    editor = ace.edit("editor_" + currentCustomComponent.replace(/\s/g, ""));
    editor.resize();
}

function resizeGptEditor() {
    var editor = $("#gpt-output");
    editor = ace.edit("gpt-output");
    editor.resize();
}

function createEditor(componentName, isGPT) {
    var dragging = false;
    var wpoffset = 0;

    var component_code = document.getElementById("box_component_code");
    var modal_components = document.getElementById("modal_components");
    var edit = document.createElement("div"); //Row
    edit.setAttribute(
        "style",
        "width: 100%; height: 100%; max-height: 100%; top: 15px; position: absolute; display: none;"
    );
    edit.setAttribute("id", "editor_" + componentName.replace(/\s/g, ""));
    edit.setAttribute("oninput", "updateClass('" + componentName + "');");
    edit.setAttribute("onpaste", "updateClass('" + componentName + "');"); //Adiciona updateClass caso o usuario copie e cole o cÃ³digo
    component_code.appendChild(edit);
    modal_components.setAttribute("onresize", "resizeEditor();");

    var editor = ace.edit("editor_" + componentName.replace(/\s/g, ""));
    editor.setTheme("ace/theme/monokai");
    editor.setOptions({
        fontSize: "14px",
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
    });
    editor.session.setMode("ace/mode/python");

    if (!(componentName in customComponentsCode)) {
        editor.setValue("");
        if (isGPT) {
            // if (ace.edit("gpt-output").getValue().indexOf("```python") == -1) editor.insert(ace.edit("gpt-output").getValue())
            // else {
            //   let begin = ace.edit("gpt-output").getValue().indexOf("\n```python\n")
            //   let end = ace.edit("gpt-output").getValue().indexOf("\n```\n")

            //   let trimmedStr = ace.edit("gpt-output").getValue().substring(begin, end).replace("\n```python\n", "")
            //   editor.insert(trimmedStr)
            // }
            editor.insert(ace.edit("gpt-output").getValue());
            updateClass(componentName);
        } else
            editor.insert(
                code_template.replace(
                    "class exampleClass",
                    "class " + componentName.replace(/ /g, "")
                )
            );
    } else {
        editor.setValue("");
        editor.insert(customComponentsCode[componentName]);
    }
    // console.log(editor.getValue())
}

function renderCode(componentName) {
    //editor.setValue("");
    //editor.insert(customComponents[componentName]["code"]);
    document.getElementById("module_name").textContent = componentName;
}

/* FunÃ§Ã£o para salvar o JSON do custom component com o nome novo da classe que estÃ¡ no cÃ³digo*/
function setJson(code, componentName) {
    var lineBreak = code.split("\n"); //Segregando o cÃ³digo em linhas
    var className;
    var commentIdx = [];

    for (var i = 0; i < lineBreak.length; i++) {
        if (lineBreak[i] == "'''") {
            //Verifica onde contÃ©m indicadores iniciais e finais de comentÃ¡rios compostos
            commentIdx.push(i);
        }
    }

    for (var j = 0; j < commentIdx.length - 1; j++) {
        if (j % 2 == 0) {
            for (var k = commentIdx[j]; k < commentIdx[j + 1]; k++) {
                //Substitui os comentÃ¡rios por "", para evitar de pegar classe dentro de comentÃ¡rios
                lineBreak[k] = "";
            }
        }
    }

    for (var lb in lineBreak) {
        if (lineBreak[lb].startsWith("class ")) {
            className = lineBreak[lb].split("(")[0];
            className = className.split(" ")[1];
            className = className.trim();
            break;
        }
    }

    // customComponents[componentName].config["component_class"] = className
    // customComponents[componentName].config["component_module"] = className.toLowerCase()
}

function updateClass(componentName) {
    var editor = ace.edit("editor_" + componentName.replace(/\s/g, ""));
    var code = editor.getValue();
    var lineBreak = code.split("\n");
    var className_;

    for (var lb in lineBreak) {
        if (lineBreak[lb].startsWith("class ")) {
            className_ = lineBreak[lb].split("(")[0];
            className_ = className_.split(" ")[1];
            className_ = className_.trim();
            break;
        }
    }
    customComponents[componentName].config["component_class"] = className_;
    customComponents[componentName].config["component_module"] =
        className_.toLowerCase();
}

function saveCode(componentName) {
    var editor = ace.edit("editor_" + componentName.replace(/\s/g, ""));
    code = editor.getValue();
    setJson(code, componentName);

    if (code != customComponents[componentName]["code"]) {
        customComponents[componentName]["code"] = customComponentsCode[
            componentName
        ] = code;
        customComponents[componentName]["edited"] = true;
    }
}

/*
FunÃ§Ã£o de manipulaÃ§Ã£o do botÃ£o que alterna entre cÃ³digo e config
*/
function switchCodeConfig() {
    checkboxCodeConfig = document.getElementById("checkbox_code_config");
    if (checkboxCodeConfig.checked == true) {
        document.getElementById("box_component_code").style.display =
            "inline-block";
        document.getElementById("box_component_config").style.display = "none";
        document.getElementById("tag_component_config").style.display = "none";
        document.getElementById("tag_component_template").style.display =
            "none";
        //document.getElementById("module_name").style.display = "inline-block";
        //document.getElementById("language_logo").style.display = "inline-block";
    } else {
        document.getElementById("box_component_code").style.display = "none";
        document.getElementById("box_component_config").style.display =
            "inline-block"; //inline
        document.getElementById("tag_component_config").style.display =
            "inline-block";
        // document.getElementById("tag_component_template").style.display = "inline-block";
        //document.getElementById("module_name").style.display = "none";
        //document.getElementById("language_logo").style.display = "none";
    }
}
