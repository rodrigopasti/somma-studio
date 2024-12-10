/*
Controle de schemas em appmaker.html
*/
var schema;

function openDivSchema(evt, divName) {
    if (divName !== schema) {
        if (evt.key == "z" || evt.key == "Z") {
            currentTarget = document.getElementById("btn_" + divName);
        }
        //Forçando a remoção dos componentes draggables para evitar de arrastar mais de um componente
        j = jsInstances[schema];
        for (i = 0; i < selectedComponents.length; i++) {
            var $componentElem = $(
                document.getElementById(selectedComponents[i])
            );
            $componentElem.css("outline-style", "none");
            j.removeFromDragSelection($componentElem);
            compRemoveElement = document.getElementById(
                "remove_component_div_" + selectedComponents[i]
            );
            if (compRemoveElement != null) {
                compRemoveElement.style.visibility = "hidden";
            }
        }

        // Declare all variables
        var i, tabcontent_schemas, tablinks_schemas;

        // Get all elements with class="tabcontent_schemas" and hide them
        tabcontent_schemas =
            document.getElementsByClassName("tabcontent_schemas");
        for (i = 0; i < tabcontent_schemas.length; i++) {
            tabcontent_schemas[i].style.display = "none";
        }

        // Get all elements with class="tablinks_schemas" and remove the class "active"
        tablinks_schemas = document.getElementsByClassName("tablinks_schemas");
        for (i = 0; i < tablinks_schemas.length; i++) {
            tablinks_schemas[i].className = tablinks_schemas[
                i
            ].className.replace(" active", "");
        }

        if (document.getElementById(divName) == null) {
            divName = schemasAliases[divName];
            currentTarget = document.getElementById("btn_" + divName);
            document.getElementById(divName).style.display = "block";
        } else {
            // Show the current tab_schemas, and add an "active" class to the button that opened the tab_schemas
            document.getElementById(divName).style.display = "block";
        }

        if (evt.key == "z" || evt.key == "Z")
            currentTarget.className += " active";
        else evt.currentTarget.className += " active";

        jsInstances[schema].repaintEverything();
        schema = divName;
        jsInstances[schema].repaintEverything();

        $("[id='" + schema + "']").focus();
    }
}

/*
Controle de schemas
*/
var schemasAliases = {};
var jsInstances = {};
var panzoomInstances = {};
var numSchemas = 5;
var schemaCount = 1;
var datasetPage = 0;

function deleteElement(elementId) {
    var element = document.getElementById(elementId);
    element.parentNode.removeChild(element);
}

function deleteSchema(schemaName) {
    if (confirm("Delete schema?")) {
        deleteElement(schemaName);
        deleteElement("btn_" + schemaName);
        updateSchemas(); //Função de renderBlock (atualizar os JSONS de aplicação)
    }
}

function resetSchema(schemaName) {
    schemaCount = 1;
    deleteElement(schemaName);
    deleteElement("btn_" + schemaName);
}

$(document).on("keypress", ".tablinks_schemas", function (e) {
    return e.which != 13;
});

$(document).ready(function () {
    $(".tablinks_schemas").keypress(function (e) {
        return e.which != 13;
    });

    function singleClick(e) {
        openDivSchema(e, this.id.split("btn_")[1]);
        //Forçando foco no schema recém selecionado
        // document.getElementById(this.id.split("btn_")[1]).focus();
    }

    $("div").on("click", "div.tablinks_schemas", function (e) {
        e.stopImmediatePropagation();
        if (this.id != "btn_plus") {
            var that = this;
            document
                .getElementById("change_schema_name_button")
                .setAttribute("onclick", "changeSchemaName('" + this.id + "')");
            setTimeout(function () {
                var dblclick = parseInt($(that).data("double"), 10);
                if (dblclick > 0) {
                    $(that).data("double", dblclick - 1);
                } else {
                    singleClick.call(that, e);
                }
            }, 20);
        } else createNewSchema();
    });

    // .on("dblclick", "div.tablinks_schemas", function(e) {
    //     e.stopImmediatePropagation()
    //     console.log(this);

    //     $(this).data('double', 2);
    //     oldAlias = this.textContent;
    //     e.currentTarget.contentEditable = true;
    //     close = document.getElementsByClassName("close");

    //     $(this).focusout(function(e) {
    //         e.currentTarget.contentEditable = false;
    //         if (oldAlias != this.textContent) {

    //             originalSchema = this.id.split("btn_")[1]

    //             if (schemasNames.includes(this.textContent)){
    //                 alert("Duplicated schema name")
    //                 this.textContent = oldAlias
    //             } else if (this.textContent in schemasAliases){
    //                 if (this.textContent == originalSchema){
    //                     schemasNames[schemasNames.indexOf(oldAlias)] = this.textContent
    //                     delete schemasAliases[oldAlias]
    //                     delete schemasAliases[originalSchema]
    //                     oldAlias = this.textContent
    //                 }

    //                 else{
    //                     alert("Schema Name previously used in this session.\nPlease refresh the page to use this name again")
    //                     this.textContent = oldAlias
    //                 }
    //             }

    //             else{
    //                 schemasNames[schemasNames.indexOf(oldAlias)] = this.textContent
    //                 schemasAliases[originalSchema] = this.textContent;
    //                 schemasAliases[this.textContent] = originalSchema
    //                 if (oldAlias != originalSchema)
    //                     delete schemasAliases[oldAlias]
    //                 oldAlias = this.textContent
    //             }
    //         }
    //     });
    // });
});

function sideScroll(container, direction, speed, distance, step) {
    var element = document.getElementById(container);
    scrollAmount = 0;
    var slideTimer = setInterval(function () {
        if (direction == "left") {
            element.scrollLeft -= step;
        } else {
            element.scrollLeft += step;
        }
        scrollAmount += step;
        if (scrollAmount >= distance) {
            window.clearInterval(slideTimer);
        }
    }, speed);
}

var changeSchemaNameOn = false;
function changeSchemaName(id) {
    var element;
    if (id.includes("btn_")) {
        element = document.getElementById(id);
    } else {
        element = document.getElementById("btn_" + id);
    }

    if (changeSchemaNameOn == false) {
        oldAlias = element.textContent;
        element.contentEditable = true;
        changeSchemaNameOn = true;
        element.style.border = "1px solid #FFFFFF";
        element.style.borderStyle = "dashed";
    } else {
        element.contentEditable = false;
        changeSchemaNameOn = false;
        element.style.border = "none";
    }

    $(element).focusout(function (e) {
        if (oldAlias != element.textContent) {
            originalSchema = element.id.split("btn_")[1];
            if (schemasNames.includes(this.textContent)) {
                alert("Duplicated schema name");
                this.textContent = oldAlias;
            } else if (this.textContent in schemasAliases) {
                if (this.textContent == originalSchema) {
                    schemasNames[schemasNames.indexOf(oldAlias)] =
                        this.textContent;
                    delete schemasAliases[oldAlias];
                    delete schemasAliases[originalSchema];
                    oldAlias = this.textContent;
                } else {
                    alert(
                        "Schema Name previously used in this session.\nPlease refresh the page to use this name again"
                    );
                    this.textContent = oldAlias;
                }
            } else {
                schemasNames[schemasNames.indexOf(oldAlias)] = this.textContent;
                schemasAliases[originalSchema] = this.textContent;
                schemasAliases[this.textContent] = originalSchema;
                if (oldAlias != originalSchema) delete schemasAliases[oldAlias];
                oldAlias = this.textContent;
            }
        }

        element.contentEditable = false;
        changeSchemaNameOn = false;
        element.style.border = "none";
    });
}

function createNewSchema() {
    var i = 0;
    do {
        i++;
        thisName = "schema_" + i;
    } while (schemasNames.indexOf(thisName) >= 0 || thisName in schemasAliases);

    createSchema(thisName);
    schemasNames.push(thisName);
}

function toggleOpenSchemaGPT(event, canvasId, componentId) {
    event.preventDefault();
    event.stopPropagation();
    const component = document.getElementById(componentId);
    const schemaBox = document.getElementById(canvasId);
    var calcX, calcY;
    var pos = [];

    if (componentId) {
        let left = component.style.left;
        let top = component.style.top;
        pos = [parseInt(left, 10), parseInt(top, 10)];
    } else {
        event.offsetX == 0
            ? (calcX = event.layerX - event.clientX)
            : (calcX = event.offsetX - event.clientX);
        event.offsetY == 0
            ? (calcY = event.layerY - event.clientY)
            : (calcY = event.offsetY - event.clientY);
        pos = [event.clientX + calcX, event.clientY + calcY];
    }
    const schemaGpt = document.getElementById("gpt_" + canvasId);

    if (!schemaGpt) {
        let newGptWrapper = document.createElement("div");
        newGptWrapper.setAttribute(
            "style",
            "position: absolute; min-width: 400px; min-height: 400px; z-index: 100; border-radius: 10px; display: block; background-color: white;"
        );
        let newGptInput = document.createElement("div");
        newGptInput.setAttribute("class", "input-field");
        newGptInput.setAttribute(
            "style",
            "position: relative; width: 300px; width: 80%"
        );

        let label = document.createElement("label");
        label.textContent = "Message";

        newGptInput.appendChild(label);

        let gptTextArea = document.createElement("textarea");

        gptTextArea.setAttribute("class", "textarea_input");
        gptTextArea.setAttribute("id", "input_schema_gpt");
        gptTextArea.setAttribute(
            "style",
            "font-size: 18px; height: 350px; padding: 10px;"
        );

        newGptInput.appendChild(gptTextArea);
        newGptWrapper.appendChild(newGptInput);

        newGptWrapper.setAttribute("id", "gpt_" + canvasId);
        newGptWrapper.style.top = pos[1] + "px";
        newGptWrapper.style.left = pos[0] + "px";

        newGptWrapper.addEventListener("mousedown", function () {
            panzoomInstances[schema].pause();
            setFocus("false", this.id);
        });

        $(newGptWrapper).draggable().resizable({ handles: "all" });

        let closeBtn = document.createElement("span");
        closeBtn.setAttribute("class", "close-messagebar");

        closeBtn.addEventListener("click", function () {
            if (newGptWrapper.style.display == "block")
                newGptWrapper.style.display = "none";
        });

        let buttonWrapper = document.createElement("div");
        buttonWrapper.setAttribute("class", "gptButtonsWrapper");
        buttonWrapper.setAttribute("style", "text-align: center;");
        let sendBtn = document.createElement("button");
        sendBtn.setAttribute("id", "gpt_send_button");
        sendBtn.setAttribute(
            "onclick",
            "generateSchemaByPrompt('" +
                schema +
                "', '" +
                componentId +
                "', '" +
                pos[0] +
                "', '" +
                pos[1] +
                "')"
        );
        sendBtn.textContent = "Send";

        buttonWrapper.appendChild(sendBtn);
        newGptWrapper.appendChild(buttonWrapper);
        newGptWrapper.appendChild(closeBtn);
        schemaBox.appendChild(newGptWrapper);
    } else {
        document
            .getElementById("gpt_send_button")
            .setAttribute(
                "onclick",
                "generateSchemaByPrompt('" +
                    schema +
                    "', '" +
                    componentId +
                    "', '" +
                    pos[0] +
                    "', '" +
                    pos[1] +
                    "')"
            );

        if (schemaGpt.style.display == "none")
            schemaGpt.style.display = "block";
        schemaGpt.style.top = pos[1] + "px";
        schemaGpt.style.left = pos[0] + "px";
    }
}
function createSchema(schemaName) {
    tablinks_schemas = document.getElementsByClassName("tablinks_schemas");
    for (i = 0; i < tablinks_schemas.length; i++) {
        tablinks_schemas[i].className = tablinks_schemas[i].className.replace(
            " active",
            ""
        );
    }

    tabcontent_schemas = document.getElementsByClassName("tabcontent_schemas");
    for (i = 0; i < tabcontent_schemas.length; i++) {
        tabcontent_schemas[i].style.display = "none";
    }

    var schemas = document.getElementById("schemas");
    var div = document.createElement("div");
    div.setAttribute("class", "tabcontent_schemas");
    div.setAttribute("id", schemaName);
    var item = document.createElement("div");
    item.setAttribute("class", "box_item");
    item.setAttribute("id", "box_item_" + schemaName);
    //Permitir drag and drop de componentes
    item.setAttribute("ondrop", "dropComp(event)");
    item.setAttribute("ondragover", "allowDropComp(event)");
    item.setAttribute("onmousedown", "clearComponentsSelection();");
    item.addEventListener("contextmenu", function (event) {
        toggleOpenSchemaGPT(event, item.id);
    });

    //Mapeando eventos de key down nesta div, que representa o schema
    // div.setAttribute("onkeydown", "componentsKeyboardEvt(event,'" + schemaName + "'); enableOrDisablePanzoom(event,'" + schemaName + "');");
    // div.setAttribute("onkeyup", "enableOrDisablePanzoom(event,'" + schemaName + "');");
    div.addEventListener("mouseover", function () {
        $(item.id).focus();
    });
    div.addEventListener("keydown", function (event) {
        componentsKeyboardEvt(event, schemaName);
        enableOrDisablePanzoom(event, schemaName);
    });
    div.addEventListener("keyup", function (event) {
        enableOrDisablePanzoom(event, schemaName);
    });
    //Adicionado devidas divs aos schemas
    div.appendChild(item);
    schemas.appendChild(div);
    //Inicializando panzoom
    panzoomInstance = panzoom(item, {
        // beforeMouseDown: function (e) {
        //     // allow wheel-zoom only if ctrlKey is pressed. Otherwise - ignore
        //     var shouldIgnore = !e.ctrlKey;
        //     return shouldIgnore;
        // },
        //zoomSpeed: 0.0
        maxZoom: 1.0,
        minZoom: 0.5,
        zoomSpeed: 0.1,
        filterKey: function (e, dx, dy, dz) {
            // don't let panzoom handle this event:
            return true;
        },
    });
    panzoomInstances[schemaName] = panzoomInstance;

    jsInstances[schemaName] = jsPlumb.getInstance({
        Container: "box_item_" + schemaName,
    });

    div.style.display = "flex";

    //Ajuste do panzoom com jsplumb
    panzoomInstances[schemaName].on("zoom", function (e) {
        jsInstances[schemaName].setZoom(e.getTransform().scale);
    });

    bindEvents(schemaName); // Bind de eventos do jsPlumb

    schema = schemaName;
    var buttonTab = document.getElementById("buttons");
    var btn = document.createElement("div");
    var btn_plus = document.getElementById("btn_plus");
    btn.setAttribute("class", "tablinks_schemas active");
    btn.setAttribute("style", "position: relative;");
    btn.setAttribute("id", "btn_" + schemaName);
    btn.textContent = schemaName;

    var errorImg = document.createElement("img");
    errorImg.setAttribute("id", "erroImg_" + schemaName);
    errorImg.setAttribute(
        "style",
        "position: absolute; right: 5px; top: 7px; width: 15px; display: none"
    );
    errorImg.setAttribute("src", "../static/img/exclamation_60px.png");
    btn.appendChild(errorImg);
    buttonTab.insertBefore(btn, btn_plus);
    schemaCount++;
    document
        .getElementById("change_schema_name_button")
        .setAttribute("onclick", "changeSchemaName('" + schemaName + "');");
    sideScroll("buttons", "right", 25, 200, 50);

    /*
    Por fim, cria menu de Run para o Schema
    */
    createRunMenu(schemaName);
    panzoomInstance.pause();
    document.getElementById(div.id).focus(); //Força o foco para não precisar clicar no canvas (pra utilizar o panzoom)
}
