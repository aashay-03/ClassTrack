const ninput = document.querySelector(".new-pass");
const nshowBtn = document.querySelector(".new-pass-btn");
const neyePatch = document.querySelector(".new-pass-eye");
const cinput = document.querySelector(".confirm-pass");
const cshowBtn = document.querySelector(".confirm-pass-btn");
const ceyePatch = document.querySelector(".confirm-pass-eye");

function triggerNewPassword() {
  if (ninput.value != "") {
    nshowBtn.style.display = "block";
    nshowBtn.onclick = function() {
      if (ninput.type == "password") {
        ninput.type = "text";
        neyePatch.src = "./images/hidden.png";
      } else {
        ninput.type = "password";
        neyePatch.src = "./images/eye.png";
      }
    }
  } else {
    nshowBtn.style.display = "none";
  }
}

function triggerConfirmPassword() {
  if (cinput.value != "") {
    cshowBtn.style.display = "block";
    cshowBtn.onclick = function() {
      if (cinput.type == "password") {
        cinput.type = "text";
        ceyePatch.src = "./images/hidden.png";
      } else {
        cinput.type = "password";
        ceyePatch.src = "./images/eye.png";
      }
    }
  } else {
    cshowBtn.style.display = "none";
  }
}
