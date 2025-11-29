const form = document.querySelector("#updateInvForm"); // match the form's actual ID
const updateBtn = document.querySelector("#updateBtn"); // select the button by ID

form.addEventListener("change", function () {
  updateBtn.removeAttribute("disabled");
});
