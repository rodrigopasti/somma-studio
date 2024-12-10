//Função para renderizar os campos após a requisição
function renderUserInfo(user) {
    document.getElementById("my_account_company").value = user["company"];
    document.getElementById("my_account_phone").value = user["phone"];
    document.getElementById("my_account_name").value = user["name"];
    document.getElementById("my_account_email").value = user["email"];
    document.getElementById("my_account_role").value = user["role"];

    let sendPromptBtn = document.getElementById("send-prompt-btn");
    if (user["max_prompt"] <= 0) {
        sendPromptBtn.style.pointerEvents = "none";
        sendPromptBtn.style.opacity = "0.5";
    }

    document.getElementById("prompt-counter").textContent =
        user["max_prompt"] + " remaining prompts";
}

// Função para efetuar a leitura dos dados do usuário (Tela de My Account)
function getUserInfo() {
    $.ajax({
        url: "/get-user-info",
        type: "GET",
        dataType: "json",
        success: function (data) {
            renderUserInfo(data);
        }
    });
}

//Função para efetuar o update das informações do usuário
function updateUserInfo() {
    updatedUserInfo = {};
    updatedUserInfo["phone"] =
        document.getElementById("my_account_phone").value;
    updatedUserInfo["name"] = document.getElementById("my_account_name").value;
    updatedUserInfo["role"] = document.getElementById("my_account_role").value;

    $.ajax({
        url: "/update-user",
        type: "POST",
        data: updatedUserInfo,
        dataType: "json",
        success: function (data) {
            messagesLog("User profile updated successfuly")
            //   console.log(data);
        }
    });
}

//Função para efetuar o update da senha do usuário
function updatePassword() {

    if (document.getElementById("my_account_new_password").value == document.getElementById("my_account_new_password2").value) {
        document.getElementById("screen-app-loader-app").style.display = 'block'
        pw_data = {}
        pw_data["old_pw"] = document.getElementById("my_account_current_password").value
        pw_data["new_pw"] = document.getElementById("my_account_new_password").value

        $.ajax({
            url: "/update-password",
            type: "POST",
            data: pw_data,
            dataType: "text",
            success: function (data) {
                if (data == "password updated") {
                    document.getElementById("window_app_container").style.pointerEvents = "none"
                    document.getElementById("close_app_modal").style.pointerEvents = "none"
                    setTimeout(function () {
                        document.getElementById("window_app_container").style.pointerEvents = "auto"
                        document.getElementById("close_app_modal").style.pointerEvents = "auto"
                        messagesLog("Password updated successfuly")
                        document.getElementById("screen-app-loader-app").style.display = 'none'

                    }, 30000);
                }
                else {
                    messagesLog("Invalid current password")
                }
            }
        });
    } else {
        messagesLog("The new password is wrong, check the fields");
    }
}

