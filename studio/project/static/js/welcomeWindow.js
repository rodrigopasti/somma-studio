const steps = {
    step_2: {
        title: "Menu de Aplicações",
        description:
            "No menu de aplicações o usuário poderá criar uma nova aplicação, observar suas aplicações compartilhadas e ter acesso aos dados de sua conta.",
    },
    step_3: {
        title: "Menu Área de trabalho",
        description:
            "Alterna entre o menu de dados e a área de trabalho. Quando ele estiver acionado terá um marcador vermelho do lado esquerdo.",
        containerStyle: "top: 50px; left: 100px; right: 0;",
        arrowStyle:
            "right: 0; left: -10px; top: 10px; transform: rotate(32deg);",
        element: "sidebar_application_option",
    },
    step_4: {
        title: "Menu de Dados",
        description:
            "Nesse menu, realiza-se o upload de bases de dados e visualizam-se as estatísticas desses dados. Quando ele estiver acionado terá o marcador vermelho do lado esquerdo.",
        containerStyle: "top: 130px; left: 100px; right: 0;",
        arrowStyle:
            "right: 0; left: -10px; top: 10px; transform: rotate(32deg);",
        element: "sidebar_datasets_option",
    },
    step_6: {
        title: "Menu Ajuda",
        description:
            "Abrirá uma nova aba do Wiki Somma, que auxiliará em possíveis dúvidas na plataforma.",
        containerStyle: "top: 295px; left: 100px; right: 0;",
        arrowStyle:
            "right: 0; left: -10px; top: 10px; transform: rotate(32deg);",
        element: "sidebar_help_option",
    },
    step_7: {
        title: "Logout",
        description: "Botão para sair da plataforma",
        containerStyle: "top: 375xp; left: 100px; right: 0;",
        arrowStyle:
            "right: 0; left: -10px; top: 10px; transform: rotate(32deg);",
        element: "sidebar_logout_option",
    },
    step_8: {
        title: "Menu de Componentes",
        description:
            "Nesse menu, serão encontrados todos os componentes disponíveis para desenvolver um esquema na Somma.",
        containerStyle: "top: 310px; left: 100px; right: 0;",
        arrowStyle:
            "right: 0; left: -10px; top: 240px; transform: rotate(32deg);",
        element: "sidebar_components_menu_option",
        buttonText: "Continue",
    },
    step_9: {
        title: "Lista de aplicações",
        description:
            "Nessa lista serão encontrados todas as aplicações pertencentes ao seu usuário. Ao selecionar uma aplicação, você poderá executar algumas ações.",
        containerStyle: "top: 150px; left: unset; right: 250px;",
        arrowStyle:
            "right: 0; left: -10px; top: 12px; transform: rotate(32deg);",
        // element: "applications_list",
        buttonText: "Continue",
    },
};

const appSteps = {
    step_2: {
        title: "Esquemas",
        description:
            "A parte inferior do Canvas conterá todos os esquemas que existem dentro da aplicação. O esquema selecionado fica destacado em cinza.",
        containerStyle: "bottom: 45px; top: auto; left: 100px;",
        arrowStyle: "transform: rotate(61deg); top: 295px; left: 20px;",
    },
    step_3: {
        title: "Navegação dos Esquemas",
        description:
            "Nesse menu, é possível copiar e colar um componente, renomear, criar e excluir um esquema, além de analisar se há algum erro no esquema.",
        containerStyle: "top: auto; bottom: 100px; right: 130px; left: auto;",
        arrowStyle: "top: 273px; left: 20px; transform: rotate(61deg);",
    },
    step_4: {
        title: "Botão de Ajuda",
        description:
            "Ao clicar nesse botão, abrirá uma aba na Somma para auxiliar o usuário em possíveis dúvidas na plataforma.",
        containerStyle: "bottom: 100px; left: auto; right: 20px;",
        arrowStyle:
            "top: 250px; right: 8px; left: auto; transform: rotate(61deg);",
    },
    step_5: {
        title: "Menu de Execuções de Aplicações",
        description:
            "Nesse menu, é possível salvar, executar, interromper a execução, observar o Log da execução, selecionar entre treinamento e aplicação, além de escolher a máquina onde a aplicação será executada.",
        containerStyle: "top: 30px; left: 240px; right: auto;",
        arrowStyle:
            "top: 15px; right: auto; transform: rotate(32deg); left: -10px;",
    },

    step_6: {
        title: "Canvas",
        description:
            "Área de trabalho onde as aplicações serão criadas. Para movimentar o Canvas é necessário pressionar o CTRL e o botão esquerdo do mouse. O zoom pode ser alterado pressionando a tecla CTRL e usando o scroll do mouse.",
        containerStyle:
            "top: 50%; margin-top: -179px; left: 50%; margin-left: -125px;",
        arrowStyle:
            "top: 15px; right: auto; transform: rotate(32deg); left: -10px;",
        buttonText: "Continue",
    },
};

function closeOrSkip(currentStepId) {
    $("#" + currentStepId).fadeOut();
    shouldShowTutorial = false;
}
function nextStep(currentStep) {
    if (userIsAdmin == "True") {
        steps["step_5"] = {
            title: "Menu Administrador",
            description:
                "Abrirá uma tela de gestão de diversos recursos da Somma. Apenas usuários administradores possuem acesso à essa página.",
            arrowStyle:
                "right: 0; left: -10px; top: 10px; transform: rotate(32deg);",
            containerStyle: "top: 215px; left: 100px; right: 0;",
            element: "sidebar_admin_option",
        };
    }
    if (currentStep == "step_8") {
        toggleOpenDropdown();
    }
    if (currentStep == "step_1") {
        let welcomeWrapper = document.createElement("div");
        welcomeWrapper.setAttribute("id", "welcome_step_2");
        welcomeWrapper.setAttribute("class", "welcome-balloons");
        welcomeWrapper.setAttribute("style", "top: 60px; right: 50px;");

        let arrow = document.createElement("img");
        arrow.setAttribute("id", "arrow_tutorial");
        arrow.setAttribute("class", "submenu-left-arrow");
        arrow.setAttribute(
            "src",
            "../../static/icons/left_arrow_comp_menu.svg"
        );
        arrow.setAttribute(
            "style",
            "right: 115px; transform: rotate(0); top: -10px;"
        );

        let closeBtn = document.createElement("span");
        closeBtn.setAttribute("id", "close-tutoral-button");
        closeBtn.setAttribute("class", "close-messagebar");
        closeBtn.setAttribute("onclick", "closeOrSkip('welcome_step_2')");
        let title = document.createElement("p");
        title.setAttribute("id", "tutorial_title");
        title.style.textAlign = "center";
        title.textContent = steps["step_2"]["title"];

        let description = document.createElement("p");
        description.textContent = steps["step_2"]["description"];
        description.setAttribute("id", "tutorial_description");

        let buttonWrapper = document.createElement("div");
        buttonWrapper.setAttribute("class", "applicationsActionsBtnWrapper");
        buttonWrapper.setAttribute(
            "style",
            "padding: 5px; margin: 0 auto; width: 200px;"
        );

        let advanceBtn = document.createElement("button");
        advanceBtn.setAttribute("id", "advance-button-tutorial");
        advanceBtn.setAttribute("class", "advance-tutorial");
        advanceBtn.setAttribute("style", "width: 100%;");
        advanceBtn.textContent = "Next";
        advanceBtn.setAttribute("onclick", "nextStep('step_2')");
        buttonWrapper.appendChild(advanceBtn);

        welcomeWrapper.appendChild(arrow);
        welcomeWrapper.appendChild(closeBtn);
        welcomeWrapper.appendChild(title);
        welcomeWrapper.appendChild(description);
        welcomeWrapper.appendChild(buttonWrapper);

        document.getElementById("schemas").appendChild(welcomeWrapper);
        $("#welcome_step_2").fadeIn();
        $("#welcome_step_1").fadeOut();
    } else {
        let currentStepNumber = parseInt(currentStep.split("_")[1]);
        nextStepNumber = currentStepNumber + 1;

        if (!steps["step_" + nextStepNumber]) {
            nextStepNumber = nextStepNumber + 1;
        }
        let shortNextStepId = "step_" + nextStepNumber;

        let nextStepId = "welcome_step_" + nextStepNumber;
        let currentWrapper = document.getElementById("welcome_" + currentStep);

        currentWrapper.setAttribute("id", nextStepId);

        $("#" + currentWrapper.id).fadeOut();

        setTimeout(function () {
            if (steps["step_" + nextStepNumber]) {
                document.getElementById("tutorial_title").textContent =
                    steps["step_" + nextStepNumber]["title"];
                document.getElementById("tutorial_description").innerHTML =
                    steps["step_" + nextStepNumber]["description"];
                document.getElementById("arrow_tutorial").style =
                    steps["step_" + nextStepNumber]["arrowStyle"];

                if (steps["step_" + nextStepNumber]["element"]) {
                    currentWrapper.style =
                        steps["step_" + nextStepNumber]["containerStyle"];
                    currentWrapper.style.top =
                        document.getElementById(
                            steps["step_" + nextStepNumber]["element"]
                        ).offsetTop + "px";
                } else {
                    currentWrapper.style =
                        steps["step_" + nextStepNumber]["containerStyle"];
                }

                if (nextStepId == "welcome_step_8")
                    currentWrapper.style.top =
                        document.getElementById(
                            steps["step_" + nextStepNumber]["element"]
                        ).offsetTop -
                        220 +
                        "px";

                document.getElementById("advance-button-tutorial").textContent =
                    steps["step_" + nextStepNumber]["buttonText"]
                        ? steps["step_" + nextStepNumber]["buttonText"]
                        : "Next";

                document
                    .getElementById("advance-button-tutorial")
                    .setAttribute(
                        "onclick",
                        'nextStep("' + shortNextStepId + '")'
                    );

                document
                    .getElementById("close-tutoral-button")
                    .setAttribute(
                        "onclick",
                        'closeOrSkip("' + nextStepId + '")'
                    );
                $("#" + currentWrapper.id).fadeIn();
            }
        }, 500);
    }
}

function nextAppSteps(currentAppStep) {
    if (currentAppStep == "step_7") openCloseMenu();

    let currentWrapper = document.getElementsByClassName("welcome-balloons")[0];

    if (currentWrapper) {
        currentWrapper.setAttribute("id", "welcome_app_" + currentAppStep);
        let currentStepNumber = parseInt(currentAppStep.split("_")[1]);
        let nextAppStepNumber = currentStepNumber + 1;
        let nextStepId = "welcome_app_step_" + nextAppStepNumber;
        var ctrlRegex = new RegExp("CTRL", "g");
        let shortNextStepId = "step_" + nextAppStepNumber;
        $("#" + currentWrapper.id).fadeOut();

        if (shouldShowTutorial) {
            setTimeout(function () {
                if (appSteps[currentAppStep]) {
                    document.getElementById("tutorial_title").textContent =
                        appSteps[currentAppStep]["title"];
                    document.getElementById("tutorial_description").innerHTML =
                        appSteps[currentAppStep]["description"];

                    if (currentAppStep == "step_6") {
                        document.getElementById(
                            "tutorial_description"
                        ).innerHTML = document
                            .getElementById("tutorial_description")
                            .innerHTML.replace(ctrlRegex, "<b>CTRL</b>");
                    }
                    document.getElementById("arrow_tutorial").style =
                        appSteps[currentAppStep]["arrowStyle"];

                    if (appSteps[currentAppStep]["element"]) {
                        currentWrapper.style =
                            appSteps[currentAppStep]["containerStyle"];
                        currentWrapper.style.top =
                            document.getElementById(
                                appSteps[currentAppStep]["element"]
                            ).offsetTop + "px";
                    } else {
                        currentWrapper.style =
                            appSteps[currentAppStep]["containerStyle"];
                    }
                    document.getElementById(
                        "advance-button-tutorial"
                    ).textContent = appSteps[currentAppStep]["buttonText"]
                        ? appSteps[currentAppStep]["buttonText"]
                        : "Next";
                    document
                        .getElementById("advance-button-tutorial")
                        .setAttribute(
                            "onclick",
                            'nextAppSteps("' + shortNextStepId + '")'
                        );

                    document
                        .getElementById("close-tutoral-button")
                        .setAttribute(
                            "onclick",
                            'closeOrSkip("' + currentWrapper.id + '")'
                        );
                    $("#" + currentWrapper.id).fadeIn();
                }
            }, 500);
        }
    }
}
