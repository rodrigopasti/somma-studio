/*
Controle do menu de componentes. Arquivo components_menu.html
*/


menuClosed = true;
//subMenuClosed = true;
subMenuClosed = {}
subMenuClosed["sub_menu_sticker"] = true;
subMenuClosed["sub_menu_data_input"] = true;
subMenuClosed["sub_menu_data_output"] = true;
subMenuClosed["sub_menu_data_transformation"] = true;
subMenuClosed["sub_menu_data_visualization"] = true;
subMenuClosed["sub_menu_text_analysis"] = true;
subMenuClosed["sub_menu_descriptive_analysis"] = true;
subMenuClosed["sub_menu_deep_learning"] = true;
subMenuClosed["sub_menu_custom_components"] = true;
subMenuClosed["sub_menu_machine_learning"] = true;
subMenuClosed["sub_menu_dataset_operations"] = true;
lastOpenedSubMenu = "";

stickersIds = ["sticker_orange", "sticker_blue"]

/*
Funções de drag and drop schemas
*/

function dragComp(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function allowDropComp(ev) {
  ev.preventDefault();
  ev.stopPropagation();
}

function dropComp(ev) {
  ev.preventDefault();
  var idName = ev.dataTransfer.getData("text");
  var calcX, calcY
  //Fazendo calculo para manter a posição correta do componente ao manipular o canvas
  ev.offsetX == 0 ? calcX = ev.layerX - ev.clientX : calcX = ev.offsetX - ev.clientX
  ev.offsetY == 0 ? calcY = ev.layerY - ev.clientY : calcY = ev.offsetY - ev.clientY
  pos = [ev.clientX + calcX, ev.clientY + calcY];

  if (stickersIds.includes(idName)) {
    var color = idName.split('_')[1]
    switch (color) {
      case color = "orange":
        color = "#FB8500"
        break;
      case color = "blue":
        color = "#219EBC"
        break;
      default:
        break;
    }

    createSticker(schema, pos, color)
  }
  else {
    //Se for custom comp, o id vêm com 'menu-', retirar da string
    if (idName.includes("menu-") == true) {
      idName = idName.split("menu-")[1];
    }
    createComponent(idName, schema, pos);
  }

  ev.stopPropagation();
}


//Teste de draggable
/*
var btnDiv = document.createElement("div");
btnDiv.setAttribute("ondrop","drop(event)");
btnDiv.setAttribute("ondragover","allowDrop(event)");
btnDiv.setAttribute("id", "btn_"+schemaName)
*/

//draggable
//btn.setAttribute("draggable","true");
//btn.setAttribute("ondragstart","drag(event)");


function renderComponentHelp() {
  componentsTemplates = getComponentsTemplates()
  compsNames = Object.keys(componentsTemplates)
  for (iComp = 0; iComp < compsNames.length; iComp++) {
    try {
      document.getElementById(compsNames[iComp]).title = componentsTemplates[compsNames[iComp]]["help"]
    }
    catch{
      continue;
    }
  }
}

function openCloseMenu() {
  if (menuClosed == true) {
    document.getElementById("components_menu_option_icon").style.display = "block"
    // document.getElementById("components_menu_wrapper").style.display = "block";
    $("#components_menu_wrapper").fadeIn()
    document.getElementById("components_menu_left_arrow").style.display = "block";

    //document.getElementById("components_menu").style.top = "20.8%";
    menuClosed = false;
  }
  else {
    document.getElementById("components_menu_option_icon").style.display = "none"
    if (lastOpenedSubMenu != "") {
      document.getElementById(lastOpenedSubMenu).style.display = "none";
      subMenuClosed[lastOpenedSubMenu] = true
    }

    // document.getElementById("components_menu_wrapper").style.display = "none";
    $("#components_menu_wrapper").fadeOut()

    document.getElementById("components_menu_left_arrow").style.display = "none";
    menuClosed = true;
    document.getElementById(lastOpenedSubMenu + "_label").style.backgroundColor = "#212121";
    document.getElementById(lastOpenedSubMenu + "_label").style.color = "white";
    var arrowImg = document.getElementById(lastOpenedSubMenu + "_label").children[1]
    arrowImg.style.display = "none"
  }
}

function openCloseSubMenu(subMenu) {
  if (subMenuClosed[subMenu] == true) {

    if (lastOpenedSubMenu != "" && subMenu != lastOpenedSubMenu) {
      document.getElementById(lastOpenedSubMenu).style.display = "none";
      document.getElementById(lastOpenedSubMenu + "_label").style.backgroundColor = "#212121";
      document.getElementById(lastOpenedSubMenu + "_label").style.color = "white";
      var arrowImg = document.getElementById(lastOpenedSubMenu + "_label").children[1]
      arrowImg.style.display = "none"
      subMenuClosed[lastOpenedSubMenu] = true;
    }
    var arrowImg = document.getElementById(subMenu + "_label").children[1]
    arrowImg.style.display = "block"
    document.getElementById(subMenu + "_label").style.backgroundColor = "#312024";
    document.getElementById(subMenu + "_label").style.color = "#C11C3F";
    document.getElementById(subMenu).style.display = "inline";
    subMenuClosed[subMenu] = false
    lastOpenedSubMenu = subMenu;


  }
  else {

    document.getElementById(subMenu).style.display = "none";
    document.getElementById(lastOpenedSubMenu + "_label").style.color = "white";
    document.getElementById(subMenu + "_label").style.backgroundColor = "#212121";
    var arrowImg = document.getElementById(subMenu + "_label").children[1]
    arrowImg.style.display = "none"
    subMenuClosed[subMenu] = true
  }
}

/*
FUNÇÕES PARA MANIPULAR O APARECIMENTO DOS TEXTOS QUANDO ABERTO POR COMPLETO
O MENU E SUBMENU
*/
function showMenu() {

  //if (document.getElementById("mySidenav").style.display != "block"){
  if (menuClosed == false) {
    var menuTextElements = document.getElementsByClassName("menu_text")
    for (var i = 0; i < menuTextElements.length; i++) {
      menuTextElements[i].style.display = "block";
    }
  }
}
function showSubMenu(subMenu) {
  //if (document.getElementById("mySidenav").style.display != "block"){
  if (subMenuClosed[subMenu] == false) {
    //console.log(document.getElementById(subMenu).children[0].style.display)
    var menuTextElements = document.getElementById(subMenu).children;
    //var menuTextElements = document.getElementsByClassName("menu_text_sub")
    for (var i = 0; i < menuTextElements.length; i++) {
      menuTextElements[i].style.display = "block";
    }
  }
}
document.getElementById("components_menu").addEventListener("transitionend", showMenu);
document.getElementById("sub_menu_data_input").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_data_input");
});
document.getElementById("sub_menu_data_output").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_data_output");
});

document.getElementById("sub_menu_data_transformation").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_data_transformation");
});
document.getElementById("sub_menu_data_visualization").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_data_visualization");
});

document.getElementById("sub_menu_text_analysis").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_text_analysis");
});
document.getElementById("sub_menu_dataset_operations").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_dataset_operations");
});

document.getElementById("sub_menu_descriptive_analysis").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_descriptive_analysis");
});

document.getElementById("sub_menu_deep_learning").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_deep_learning");
});
document.getElementById("sub_menu_machine_learning").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_machine_learning");
});
document.getElementById("sub_menu_custom_components").addEventListener("transitionend", function () {
  showSubMenu("sub_menu_custom_components");
});
