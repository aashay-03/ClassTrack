const redirectTo = (path) => {
  location.href = `http://localhost:3000/${path}`;
};

const backToHome = () => {
  redirectTo("");
};

const backToHomeTeacher = () => {
  redirectTo("teacherHome");
};

const backToUploadPage = () => {
  redirectTo("uploadattendancescreenshot");
};
