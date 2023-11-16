const myInput = document.querySelector(".hidden-input");
const firstImage = document.querySelector("#firstFile");
const firstLabel = document.querySelector(".first-sl");
const submitBtn = document.querySelector(".submitBtn");
const displayBtn = document.querySelector(".displayBtn");

/* ############### Custom Dropdown Menu ############### */

var x, i, j, l, ll, selElmnt, a, b, c;
x = document.getElementsByClassName("custom-select");
l = x.length;

for (i = 0; i < l; i++) {
  selElmnt = x[i].getElementsByTagName("select")[0];
  ll = selElmnt.length;
  a = document.createElement("DIV");
  a.setAttribute("class", "select-selected");
  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
  x[i].appendChild(a);
  b = document.createElement("DIV");
  b.setAttribute("class", "select-items select-hide");

  for (j = 1; j < ll; j++) {
    c = document.createElement("DIV");
    c.innerHTML = selElmnt.options[j].innerHTML;
    c.addEventListener("click", function(e) {
      myInput.value = this.innerHTML;
      var y, i, k, s, h, sl, yl;
      s = this.parentNode.parentNode.getElementsByTagName("select")[0];
      sl = s.length;
      h = this.parentNode.previousSibling;

      for (i = 0; i < sl; i++) {
        if (s.options[i].innerHTML == this.innerHTML) {
          s.selectedIndex = i;
          h.innerHTML = this.innerHTML;
          y = this.parentNode.getElementsByClassName("same-as-selected");
          yl = y.length;
          for (k = 0; k < yl; k++) {
            y[k].removeAttribute("class");
          }
          this.setAttribute("class", "same-as-selected");
          break;
        }
      }
      h.click();
    });
    b.appendChild(c);
  }

  x[i].appendChild(b);
  a.addEventListener("click", function(e) {
    e.stopPropagation();
    closeAllSelect(this);
    this.nextSibling.classList.toggle("select-hide");
    this.classList.toggle("select-arrow-active");
  });
}

const closeAllSelect = elmnt => {
  var x, y, i, xl, yl, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  xl = x.length;
  yl = y.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
}

document.addEventListener("click", closeAllSelect);

/* ############### File Type Detection ############### */

const showSubmitBtn = () => {
  submitBtn.style.display = "inline-block";
  displayBtn.style.display = "none";
};

const hideSubmitBtn = () => {
  submitBtn.style.display = "none";
  displayBtn.style.display = "inline-block";
};

const showErrorMessage = () => {
  firstLabel.innerHTML = "Invalid File Type";
  firstLabel.style.visibility = "visible";
};

const hideErrorMessage = () => {
  firstLabel.style.visibility = "hidden";
};

const isImage = (ext) => ext === "png;" || ext === "jpeg";

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
]).then(start)

function start() {
  firstImage.addEventListener("change", async () => {
    try {
      hideSubmitBtn();

      const firstPhoto = await faceapi.bufferToImage(firstImage.files[0]);
      const ext = firstPhoto.src.substring(11, 15);

      if (isImage(ext)) {
        hideSubmitBtn();
        hideErrorMessage();

        const detections = await faceapi.detectAllFaces(firstPhoto).withFaceLandmarks().withFaceDescriptors();
        const len = detections.length;

        showSubmitBtn();
        hideErrorMessage();
      } else {
        showErrorMessage();
      }
    } catch (err) {
      err.type === "error" ? showErrorMessage() : hideErrorMessage();
    }
  });
}
