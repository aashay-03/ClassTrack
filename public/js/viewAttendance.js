const studentNames = document.querySelector(".student-names");
const imageLinks = document.querySelector(".image-links");
const enrollmentNos = document.querySelector(".student-enrollmentno");
const footerText = document.querySelector(".footer-text");
const btn = document.querySelector(".mark-attendance-btn");
const myPara = document.querySelector(".present-students");

/* ############### Face Recognition ############### */

document.addEventListener("DOMContentLoaded", function(event) {

  async function face() {
    footerText.style.display = "block";
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    const img = document.querySelector(".attendance-screen-shot");
    let faceDescriptions = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
    const canvas = document.querySelector(".overlay");
    faceapi.matchDimensions(canvas, img);
    faceDescriptions = faceapi.resizeResults(faceDescriptions, img);
    faceapi.draw.drawDetections(canvas, faceDescriptions);

    const students = studentNames.innerHTML.split(",");
    const links = imageLinks.innerHTML.split(",");
    const enrollmentnos = enrollmentNos.innerHTML.split(",");
    const labels = [];
    for(let j=0; j<students.length; j++){
      const identity = students[j] + "-" + enrollmentnos[j];
      labels.push(identity);
    }
    let i = 0;
    const labeledFaceDescriptors = await Promise.all(
      labels.map(async label => {
        const imgUrl = links[i];
        i++;
        const img = await faceapi.fetchImage(imgUrl);
        const faceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        const faceDescriptors = [faceDescription.descriptor];
        return new faceapi.LabeledFaceDescriptors(label, faceDescriptors);
      })
    );

    const threshold = 0.6;
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, threshold);

    const results = faceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor));

    const presentStudents = [];

    results.forEach((bestMatch, i) => {
      footerText.style.display = "none";
      const box = faceDescriptions[i].detection.box;
      const matchValue = bestMatch._label;
      const nameOfStudent = matchValue.split("-");
      if(nameOfStudent.length === 2){
        presentStudents.push(matchValue);
        myPara.value = presentStudents;
      }
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: nameOfStudent[0]
      })
      drawBox.draw(canvas);
      btn.style.display = "inline-block";
    });
  }

  face();

});
