/*
Controla alternar entre tela da aplicação e tela de datasets. Usado em appmaker.html
*/

var currentTab; //Variável que contém a aba que está aberta
function openDatasets(
    dataset,
    page,
    field = null,
    option = null,
    value = null
) {
    document.getElementById(
        "sidebar_components_menu_option"
    ).style.pointerEvents = "none";
    document.getElementById("sidebar_components_menu_option").style.opacity =
        "0.5";

    document.getElementById("datasets_option_icon").style.display = "block";
    currentTab == "datasets" ? null : closeCurrentTab(currentTab);

    currentTab = "datasets";
    if (document.getElementById("amb-cnf-embedded-container-1")) {
        // document.getElementById("amb-cnf-embedded-container-1").style.bottom = "0"
        document.getElementById("amb-cnf-embedded-container-1").style.zIndex =
            "10";
    }

    $("#datasets_def").prop("class", "loader_app");
    document.getElementById("datasets").style.display = "block";
    document.getElementById("schemas").style.display = "none";

    if (dataset) {
        let datasetsResult = $("#datasets").load(
            "/datasets?collection=" +
                encodeURIComponent(dataset) +
                "&page=" +
                page +
                "&field=" +
                encodeURIComponent(field) +
                "&option=" +
                option +
                "&value=" +
                encodeURIComponent(value),
            function () {
                // messagesLog(datasetsResult[0].innerHTML);
                datasetPage = page;
            }
        );
    }
    //if (dataset){
    //  $("#datasets").load("/datasets?collection="+dataset+"&page=" +page)
    //  datasetPage = page
    //}
    else {
        let datasetsResult = $("#datasets").load("/datasets", function () {
            console.log('here', datasetsResult)
            // messagesLog(datasetsResult[0].innerHTML);
        });
    }
}

function openAdmin() {
    document.getElementById(
        "sidebar_components_menu_option"
    ).style.pointerEvents = "none";
    document.getElementById("sidebar_components_menu_option").style.opacity =
        "0.5";

    getAllPlans();
    getUsersByCompany();
    getUsedServers();
    getOrders();

    openMenu("servers");

    closeCurrentTab(currentTab);
    currentTab = "admin";
    document.getElementById("admin_tab").style.display = "block";
    document.getElementById("admin_option_icon").style.display = "block";
    // document.getElementById("datasets").style.display = "none"
}

function openApplicationTab(isDefault) {
    document.getElementById("application_option_icon").style.display = "block";
    if (isDefault == true || !hasApplicationOpened) {
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.pointerEvents = "none";
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.opacity = "0.5";
    } else {
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.pointerEvents = "all";
        document.getElementById(
            "sidebar_components_menu_option"
        ).style.opacity = "1";
    }

    currentTab == "application_tab" ? null : closeCurrentTab(currentTab);

    currentTab = "application_tab";
    if (document.getElementById("amb-cnf-embedded-container-1")) {
        // document.getElementById("amb-cnf-embedded-container-1").style.bottom = "50px"
        document.getElementById("amb-cnf-embedded-container-1").style.zIndex =
            "10";
    }
    // document.getElementById("datasets").style.display = "none"
    document.getElementById("schemas").style.display = "block";
    $("#datasets").empty();
}

function closeCurrentTab(currentTab) {
    if (currentTab == "application_tab") {
        document.getElementById("schemas").style.display = "none";
        document.getElementById("application_option_icon").style.display =
            "none";
    } else if (currentTab == "datasets") {
        document.getElementById("datasets").style.display = "none";
        document.getElementById("datasets_option_icon").style.display = "none";
    } else if (currentTab == "admin") {
        document.getElementById("admin_tab").style.display = "none";
        document.getElementById("admin_option_icon").style.display = "none";
    }
}

//Função específica de closeDataset
function closeDatasets() {
    if (document.getElementById("amb-cnf-embedded-container-1")) {
        document.getElementById("amb-cnf-embedded-container-1").style.bottom =
            "50px";
        document.getElementById("amb-cnf-embedded-container-1").style.zIndex =
            "10";
    }

    document.getElementById("datasets").style.display = "none";
    document.getElementById("schemas").style.display = "block";
    $("#datasets").empty();
    var modalComponents = document.getElementById("modal_components");

    if (
        modalComponents.style.display == "none" &&
        modalComponentsExists == true
    ) {
        modalComponents.style.display = "block";
    }
}
