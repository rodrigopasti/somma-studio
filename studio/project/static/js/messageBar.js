var timeOut;
function showMessageBar(message) {
  if (timeOut) {
    clearTimeout(timeOut)
  }
  var messageBar = document.getElementById("message_bar")
  messageBar.textContent = message
  $("#message_bar_wrapper").fadeIn("slow").css("display", "inline-block")
  timeOut = setTimeout(function () { $("#message_bar_wrapper").fadeOut() }, 8000);
}

function closeMessageBar() {
  if (document.getElementById("message_bar_wrapper").style.display == "inline-block") {
    $("#message_bar_wrapper").fadeOut();
    clearTimeout(timeOut)
  }

} 