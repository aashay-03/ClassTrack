const input = document.querySelector(".pass");
const showBtn = document.querySelector(".showBtn");
const eyePatch = document.querySelector(".eye-image");
const myInput = document.querySelector(".hidden-input");

input.addEventListener("input", () => togglePasswordVisibility(input, showBtn, eyePatch));

const togglePasswordVisibility = (input, showBtn, eyePatch) => {
  if (input.value !== "") {
    showBtn.style.display = "block";
    showBtn.onclick = () => {
      input.type = input.type === "password" ? "text" : "password";
      eyePatch.src = `./images/${input.type === "password" ? "hidden" : "eye"}.png`;
    };
  } else {
    showBtn.style.display = "none";
  }
};
