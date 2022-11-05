const input = document.querySelector(".pass");
const showBtn = document.querySelector(".showBtn");
const eyePatch = document.querySelector(".eye-image");
const myInput = document.querySelector(".hidden-input");

function trigger() {
  if (input.value != "") {
    showBtn.style.display = "block";
    showBtn.onclick = function() {
      if (input.type == "password") {
        input.type = "text";
        eyePatch.src = "./images/hidden.png";
      } else {
        input.type = "password";
        eyePatch.src = "./images/eye.png";
      }
    }
  } else {
    showBtn.style.display = "none";
  }
}
