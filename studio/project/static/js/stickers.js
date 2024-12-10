var stickerCount = 0

function createSticker(appSchema, pos, color) {

    var j
    jsInstances[appSchema] != undefined ? j = jsInstances[appSchema] : j = jsInstances[schemasAliases[appSchema]]

    document.getElementById("box_item_" + appSchema) != null ? element = document.getElementById("box_item_" + appSchema) :
        element = document.getElementById("box_item_" + schemasAliases[appSchema])

    currentTop = element.getBoundingClientRect().top;
    currentLeft = element.getBoundingClientRect().left;
    if (pos == "none") {
        compTop = 512 - currentTop;
        compLeft = 512 - currentLeft;
    }
    else {
        compTop = pos[1];
        compLeft = pos[0];
    }

    var box
    document.getElementById("box_item_" + appSchema) != null ? box = document.getElementById("box_item_" + appSchema)
        : box = document.getElementById("box_item_" + schemasAliases[appSchema])

    stickerCount++

    var stickerWrapper = document.createElement('div');
    stickerWrapper.setAttribute("id", "sticker" + "-xx-" + stickerCount.toString());
    stickerWrapper.setAttribute("class", "sticker-wrapper");
    stickerWrapper.style.left = compLeft.toString() + "px"
    stickerWrapper.style.top = compTop.toString() + "px"
    stickerWrapper.style.backgroundColor = color
    stickerWrapper.style.zIndex = "100"

    stickerWrapper.addEventListener('click', function (event) {
        if (event.target.id.startsWith("delete_"))
            event.stopPropagation()
    });
    stickerWrapper.addEventListener('mousedown', function (event) {
        setFocus('false', stickerWrapper.id)
    });
    var stickerHeader = document.createElement('div')
    stickerHeader.setAttribute("class", "sticker-header")
    stickerHeader.style.backgroundColor = color
    stickerHeader.setAttribute("id", "sticker-header-xx-" + stickerCount.toString())

    var stickerContent = document.createElement('textarea')
    stickerContent.setAttribute("class", "sticker-content")
    stickerContent.setAttribute("id", "sticker-content-xx-" + stickerCount.toString())
    stickerContent.setAttribute("onclick", "setOnclickInputs(null, '" + stickerContent.id + "')")
    stickerContent.style.backgroundColor = color
    stickerContent.addEventListener("click", function () {
        this.setAttribute("contenteditable", "true")
        this.focus()
    })
    stickerContent.addEventListener("focusout", function () {
        this.setAttribute("contenteditable", "false")

    })

    var deleteSpan = document.createElement('span')
    deleteSpan.setAttribute("class", "close-messagebar")
    deleteSpan.setAttribute("id", "delete_span_sticker_" + stickerCount.toString())
    deleteSpan.setAttribute("onclick", "deleteSticker('" + appSchema + "', '" + stickerWrapper.id + "')")

    deleteSpan.setAttribute("onmouseover", "blockResizable(event, this)")
    deleteSpan.setAttribute("onmouseout", "blockResizable(event, this)")



    stickerHeader.appendChild(deleteSpan)
    stickerWrapper.appendChild(stickerContent)
    stickerWrapper.appendChild(stickerHeader)

    box.appendChild(stickerWrapper)

    $("#" + stickerWrapper.id).resizable({
        handles: "n, nw, w, sw, s, se, e",
        cancel: ".cancel"
    })

    $("#" + stickerWrapper.id).draggable({
        handle: ("#" + stickerHeader.id),
        cancel: ("#" + deleteSpan.id),
        containment: "parent"

    }, this.generateDragConfig(box))

    updateSchemas()
}


function createLoadedSticker(stickerData, appSchema) {

    var box
    document.getElementById("box_item_" + appSchema) != null ? box = document.getElementById("box_item_" + appSchema)
        : box = document.getElementById("box_item_" + schemasAliases[appSchema])


    var idCount = stickerData["sticker_div_id"].split("-xx-")[1]

    var stickerWrapper = document.createElement('div');
    stickerWrapper.setAttribute("id", stickerData["sticker_div_id"]);
    stickerWrapper.setAttribute("class", "sticker-wrapper");
    stickerWrapper.style.left = stickerData["position_left"] + "px"
    stickerWrapper.style.top = stickerData["position_top"] + "px"
    stickerWrapper.style.backgroundColor = stickerData["color"]
    stickerWrapper.style.width = stickerData["width"]
    stickerWrapper.style.height = stickerData["height"]
    stickerWrapper.style.zIndex = "100"
    stickerWrapper.addEventListener('click', function (event) {
        if (event.target.id.startsWith("delete_"))
            event.stopPropagation()
    });

    stickerWrapper.addEventListener('mousedown', function (event) {
        setFocus('false', stickerWrapper.id)
    });

    var stickerHeader = document.createElement('div')
    stickerHeader.setAttribute("class", "sticker-header")
    stickerHeader.style.backgroundColor = stickerData["color"]
    stickerHeader.setAttribute("id", "sticker-header-xx-" + idCount)

    var stickerContent = document.createElement('textarea')
    stickerContent.setAttribute("class", "sticker-content")
    stickerContent.setAttribute("id", "sticker-content-xx-" + idCount)
    stickerContent.style.backgroundColor = stickerData["color"]
    stickerContent.addEventListener("click", function () {
        this.setAttribute("contenteditable", "true")
        this.focus()
    })
    stickerContent.addEventListener("focusout", function () {
        this.setAttribute("contenteditable", "false")

    })
    stickerContent.setAttribute("onclick", "setOnclickInputs(null, '" + stickerContent.id + "')")
    stickerContent.textContent = stickerData["content"]

    var deleteSpan = document.createElement('span')
    deleteSpan.setAttribute("class", "close-messagebar")
    deleteSpan.setAttribute("id", "delete_span_sticker_" + idCount)
    deleteSpan.setAttribute("onclick", "deleteSticker('" + appSchema + "', '" + stickerWrapper.id + "')")

    deleteSpan.setAttribute("onmouseover", "blockResizable(event, this)")
    deleteSpan.setAttribute("onmouseout", "blockResizable(event, this)")



    stickerHeader.appendChild(deleteSpan)
    stickerWrapper.appendChild(stickerContent)
    stickerWrapper.appendChild(stickerHeader)

    box.appendChild(stickerWrapper)

    $("#" + stickerWrapper.id).resizable({
        handles: "n, nw, w, sw, s, se, e",
        cancel: ".cancel"
    })

    $("#" + stickerWrapper.id).draggable({
        handle: ("#" + stickerHeader.id),
        cancel: ("#" + deleteSpan.id),
        containment: "parent"

    }, generateDragConfig(box))

}

function deleteSticker(schemaName, stickerId) {
    var j
    jsInstances[schemaName] != undefined ? j = jsInstances[schemaName] : j = jsInstances[schemasAliases[schemaName]]
    j.remove(stickerId)
    updateSchemas()
}

//Função toggle para desativar/reativar o rezisable 
function blockResizable(ev, element) {
    if (ev.type == "mouseover") {
        var parentNode = document.getElementById(element.id).parentElement
        var sticker = document.getElementById(parentNode.id).parentElement
        $("#" + sticker.id).resizable("disable")
    }
    else if (ev.type == "mouseout") {
        var parentNode = document.getElementById(element.id).parentElement
        var sticker = document.getElementById(parentNode.id).parentElement
        $("#" + sticker.id).resizable("enable")
    }
}


