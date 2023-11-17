const router = require("express").Router();

const Attendance = require("../models/attendanceModel");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const UploadedImages = require("../models/uploadedImagesModel");

const {
  ensureAuthTeacher,
  ensureGuestTeacher
} = require("../middleware/authMiddleware");

const fileUpload = require("express-fileupload");
const cloudinary = require("../config/cloudinary-config");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const sendResetPasswordMail = (name, email, token) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: "Reset Password",
    html: '<p>Hi ' + name + ', </p><p>Please click <a href="http://localhost:3000/resetPassword?token=' + token + '">here</a> to reset your password.</p><br><p>Regards</p><p>Project Admin</p>'
  };

  transport.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log(info);
    }
  });
}

router.get("/", ensureGuestTeacher, function(req, res) {
  res.redirect("/teacherLogin");
});

router.get("/teacherLogin", ensureGuestTeacher, function(req, res) {
  res.render("teacherLogin");
});

router.get("/teacherRegister", ensureGuestTeacher, function(req, res) {
  res.render("teacherRegister");
});

router.get("/forgotPassword", ensureGuestTeacher, function(req, res) {
  res.render("forgotPassword");
});

router.post("/forgotPassword", async function(req, res) {
  const email = req.body.username;
  try {
    const result = await Teacher.findOne({
      username: email
    });
    if (!result) {
      let errors = [];
      errors.push({
        msg: "Invalid Email"
      });
      res.render("forgotPassword", {
        errors
      });
    } else {
      const randomstringVariable = randomstring.generate();
      try {
        const updateResult = await Teacher.updateOne({
          username: email
        }, {
          $set: {
            token: randomstringVariable
          }
        });
        sendResetPasswordMail(result.teacherName, result.username, randomstringVariable);
        res.render("forgotPassword", {
          success_msg: "Email Sent!"
        });
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/resetPassword", ensureGuestTeacher, async function(req, res) {
  try {
    const result = await Teacher.findOne({
      token: req.query.token
    });
    if (!result) {
      res.status(200).send({
        msg: "Invalid Link"
      });
    } else {
      res.render("resetPassword", {
        token: req.query.token
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/resetPassword", async function(req, res) {
  const newPassword = req.body.newpassword;
  const confirmPassword = req.body.confirmpassword;
  let errors = [];
  if (newPassword.length < 6) {
    errors.push({
      msg: "Password should be atleast 6 characters"
    });
  }
  if (errors.length > 0) {
    res.render("resetPassword", {
      errors,
      token: req.body.token
    });
  } else {
    if (newPassword !== confirmPassword) {
      errors.push({
        msg: "Passwords don't match"
      });
    }
    if (errors.length > 0) {
      res.render("resetPassword", {
        errors,
        token: req.body.token
      });
    } else {
      try {
        const user = await Teacher.findOne({
          token: req.body.token
        });
        if (user) {
          await user.setPassword(newPassword);

          try {
            const updatedUser = await Teacher.updateOne({
              _id: user._id
            }, {
              hash: user.hash,
              salt: user.salt,
              token: ''
            });
            if (updatedUser) {
              res.render("teacherLogin", {
                success_msg: "Password Changed Successfully!"
              });
            }
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    }
  }
});

router.get("/teacherHome", ensureAuthTeacher, function(req, res) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render("teacherHome", {
    teacherName: req.user.teacherName,
    email: req.user.username
  });
});

router.post("/takemehome", function(req, res) {
  res.redirect("/teacherHome");
});

router.post("/markattendance", function(req, res) {
  res.redirect("uploadattendancescreenshot");
});

router.get("/uploadattendancescreenshot", ensureAuthTeacher, function(req, res) {
  const d = new Date();
  let todaysDate = "";
  let date = d.getDate();
  if (date >= 1 && date <= 9) {
    date = "0" + date;
  }
  let month = d.getMonth() + 1;
  if (month >= 1 && month <= 9) {
    month = "0" + month;
  }
  let year = d.getFullYear();
  todaysDate += year + "-" + month + "-" + date;
  res.render("markAttendance", {
    teacherName: req.user.teacherName,
    email: req.user.username,
    branchValue: "Select Branch",
    branch: "Select Branch",
    todaysDate: todaysDate,
    dateSelected: ""
  });
});

router.post("/uploadimages", async function(req, res) {
  let errors = [];
  const d = new Date();
  let todaysDate = "";
  let date = d.getDate();
  if (date >= 1 && date <= 9) {
    date = "0" + date;
  }
  let month = d.getMonth() + 1;
  if (month >= 1 && month <= 9) {
    month = "0" + month;
  }
  let year = d.getFullYear();
  todaysDate += year + "-" + month + "-" + date;
  if (req.body.branch === "Select Branch") {
    errors.push({
      msg: "Please Select Branch"
    });
  }
  if (errors.length > 0) {
    res.render("markAttendance", {
      errors,
      teacherName: req.body.teacherName,
      email: req.user.username,
      branchValue: "Select Branch",
      branch: "Select Branch",
      todaysDate: todaysDate,
      dateSelected: ""
    });
  } else {
    const firstImage = req.files.firstImage;
    const dateOfAttendance = req.body.attendanceDate.split("-");
    const day = parseInt(dateOfAttendance[2]);
    const month = parseInt(dateOfAttendance[1]);
    try {
      const result = await Attendance.findOne({
        teacherEmail: req.user.username,
        branch: req.body.branch,
        month: month,
        day: day
      });
      if (result) {
        errors.push({
          msg: "Attendance is already marked for this date"
        });
        if (errors.length > 0) {
          res.render("markAttendance", {
            errors,
            teacherName: req.body.teacherName,
            email: req.user.username,
            branchValue: req.body.branch,
            branch: req.body.branch,
            todaysDate: todaysDate,
            dateSelected: ""
          });
        }
      } else {
        const result = await cloudinary.uploader.upload(firstImage.tempFilePath);
        const firstLink = result.url;

        const imageuploaded = new UploadedImages({
          email: req.user.username,
          firstImagePath: firstLink,
          branch: req.body.branch,
          day: day,
          month: month
        });

        await imageuploaded.save();
        res.redirect("/uploadAttendance");
      }
    } catch (err) {
      console.error(err);
    }
  }
});

router.get("/uploadAttendance", ensureAuthTeacher, async function(req, res) {
  try {
    const result = await UploadedImages.find({
      email: req.user.username
    });
    if (result) {
      const len = result.length;
      const branch = result[len - 1].branch;
      const day = result[len - 1].day;
      const month = result[len - 1].month;
      const studentNames = [];
      const imageLinks = [];
      const studentEnrollmentNo = [];

      try {
        const studentData = await Student.find({
          branch: branch
        });

        if (studentData) {
          for (let i = 0; i < studentData.length; i++) {
            studentNames.push(studentData[i].studentName);
            imageLinks.push(studentData[i].studentImage);
            studentEnrollmentNo.push(studentData[i].enrollmentno);
          }

          const imageUploadedLink = "" + result[len - 1].firstImagePath;

          res.render("attendancePage", {
            teacherName: req.user.teacherName,
            imageUploaded: imageUploadedLink,
            studentNames: studentNames,
            imageLinks: imageLinks,
            studentEnrollmentNo: studentEnrollmentNo,
            branch: branch,
            day: day,
            month: month
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

router.post("/uploadAttendance", async function(req, res) {
  try {
    const attendanceRecord = new Attendance({
      teacherEmail: req.user.username,
      branch: req.body.branch,
      day: req.body.day,
      month: req.body.month,
      studentsPresent: req.body.studentsWhoAttend.split(",")
    });
    await attendanceRecord.save();

    res.render("attendanceUploaded", {
      teacherName: req.body.teacherName,
      email: req.user.username,
      branch: req.body.branch,
      day: req.body.day,
      month: req.body.month
    });
  } catch (err) {
    console.error(err);
  }
});

router.post("/viewAttendance", async function(req, res) {
  try {
    const result = await Attendance.findOne({
      teacherEmail: req.body.email,
      branch: req.body.branch,
      month: req.body.month,
      day: req.body.day
    });

    const studentNames = [];
    const studentEnrollmentNo = [];

    if (result) {
      try {
        const studentData = await Student.find({
          branch: req.body.branch
        });

        if (studentData) {
          for (let i = 0; i < studentData.length; i++) {
            studentNames.push(studentData[i].studentName);
            studentEnrollmentNo.push(studentData[i].enrollmentno);
          }

          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const month = months[req.body.month - 1];
          const date = req.body.day + " " + month;
          const present = [];

          for (let i = 0; i < result.studentsPresent.length; i++) {
            const myArray = result.studentsPresent[i].split("-");
            const index = studentEnrollmentNo.indexOf(myArray[1]);
            if (index > -1) {
              studentNames.splice(index, 1);
              studentEnrollmentNo.splice(index, 1);
            }
            const presentStudent = {
              enrollmentno: myArray[1],
              studentName: myArray[0]
            }
            present.push(presentStudent);
          }

          const absent = [];
          for (let i = 0; i < studentEnrollmentNo.length; i++) {
            const absentStudent = {
              enrollmentno: studentEnrollmentNo[i],
              studentName: studentNames[i]
            }
            absent.push(absentStudent);
          }

          res.render("viewClassAttendance", {
            teacherName: req.body.teacherName,
            branch: req.body.branch,
            date: date,
            month: month,
            present: present,
            absent: absent,
            key: 1
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

router.post("/viewmonthlyattendance", function(req, res) {
  res.redirect("/viewAttendanceofMonth");
});

router.get("/viewAttendanceofMonth", ensureAuthTeacher, function(req, res) {
  res.render("viewMonthAttendance", {
    teacherName: req.user.teacherName,
    attendanceMonth: "Select Month",
    branchValue: "Select Branch",
    branch: "Select Branch",
    noOfDays: 0,
    studentNames: [],
    studentEnrollmentNo: [],
    dayNumber: 1,
    key: 1,
    isSelected: false,
    result: [],
    attendanceStatus: []
  });
});

router.post("/attendanceofmonth", async function(req, res) {
  let errors = [];
  if (req.body.attendanceMonth === "Select Month") {
    errors.push({
      msg: "Please Select Month"
    });
  }
  if (errors.length > 0) {
    if (req.body.branch === "") {
      req.body.branch = "Select Branch";
    }
    res.render("viewMonthAttendance", {
      errors,
      teacherName: req.user.teacherName,
      attendanceMonth: "Select Month",
      branchValue: req.body.branch,
      branch: req.body.branch,
      noOfDays: 0,
      studentNames: [],
      studentEnrollmentNo: [],
      dayNumber: 1,
      key: 1,
      isSelected: false,
      result: [],
      attendanceStatus: []
    });
  } else {
    if (req.body.branch === "Select Branch") {
      errors.push({
        msg: "Please Select Branch"
      });
    }
    if (errors.length > 0) {
      res.render("viewMonthAttendance", {
        errors,
        teacherName: req.user.teacherName,
        attendanceMonth: req.body.attendanceMonth,
        branchValue: "Select Branch",
        branch: "Select Branch",
        noOfDays: 0,
        studentNames: [],
        studentEnrollmentNo: [],
        dayNumber: 1,
        key: 1,
        isSelected: false,
        result: [],
        attendanceStatus: []
      });
    } else {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      try {
        const result = await Attendance.find({
          teacherEmail: req.user.username,
          month: months.indexOf(req.body.attendanceMonth) + 1,
          branch: req.body.branch
        });

        if (result) {
          const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          const idx = months.indexOf(req.body.attendanceMonth);
          const noOfDays = daysInMonth[idx];

          try {
            const studentData = await Student.find({
              branch: req.body.branch
            });

            if (studentData) {
              const studentNames = [];
              const studentEnrollmentNo = [];
              const attendanceStatus = [];

              for (let i = 0; i < noOfDays; i++) {
                attendanceStatus.push({});
              }

              for (let i = 0; i < result.length; i++) {
                const myObj = result[i];
                const dateIdx = myObj.day - 1;
                const presentStudentsEnrollment = [];
                const myArray = myObj.studentsPresent;
                for (let j = 0; j < myArray.length; j++) {
                  const enrollmentOfPresentStudent = myArray[j].split("-")[1];
                  presentStudentsEnrollment.push(enrollmentOfPresentStudent);
                }
                const newObj = {
                  studentArray: presentStudentsEnrollment
                }
                attendanceStatus[dateIdx] = newObj
              }

              for (let i = 0; i < studentData.length; i++) {
                studentNames.push(studentData[i].studentName);
                studentEnrollmentNo.push(studentData[i].enrollmentno);
              }

              res.render("viewMonthAttendance", {
                teacherName: req.user.teacherName,
                attendanceMonth: req.body.attendanceMonth,
                branchValue: req.body.branch,
                branch: req.body.branch,
                noOfDays: noOfDays,
                studentNames: studentNames,
                studentEnrollmentNo: studentEnrollmentNo,
                dayNumber: 1,
                key: 1,
                isSelected: true,
                result: result,
                attendanceStatus: attendanceStatus
              });
            }
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
})

router.get("/teacherLogout", ensureAuthTeacher, function(req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    } else {
      req.flash("success_msg", "You are logged out");
      res.redirect("/teacherLogin");
    }
  });
});

module.exports = router;
