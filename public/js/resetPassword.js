const ninput = document.querySelector(".new-pass");
const nshowBtn = document.querySelector(".new-pass-btn");
const neyePatch = document.querySelector(".new-pass-eye");
const cinput = document.querySelector(".confirm-pass");
const cshowBtn = document.querySelector(".confirm-pass-btn");
const ceyePatch = document.querySelector(".confirm-pass-eye");

ninput.addEventListener("input", () => togglePasswordVisibility(ninput, nshowBtn, neyePatch));
cinput.addEventListener("input", () => togglePasswordVisibility(cinput, cshowBtn, ceyePatch));

const togglePasswordVisibility = (input, showBtn, eyePatch) => {
  if (input.value !== "") {
    showBtn.style.display = "block";
    showBtn.onclick = () => {
      input.type = input.type === "password" ? "text" : "password";
      eyePatch.src = `./images/${input.type === "password" ? "eye" : "hidden"}.png`;
    };
  } else {
    showBtn.style.display = "none";
  }
};
