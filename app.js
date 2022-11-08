require("dotenv").config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require("connect-flash");
const path = require("path");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const LocalStrategy = require("passport-local").Strategy;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(fileUpload({
  useTempFiles: true
}));

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use(function(req, res, next) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

const college_code = process.env.COLLEGE_CODE;

const mongo_database = process.env.MONGO_REMOTE;

mongoose.connect(`${mongo_database}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const teacherSchema = new mongoose.Schema({
  email: String,
  password: String,
  teacherName: String,
  token: {
    type: String,
    default: ""
  }
});

const uploadedImagesSchema = new mongoose.Schema({
  email: String,
  firstImagePath: String,
  branch: String,
  day: Number,
  month: Number
});

const studentSchema = new mongoose.Schema({
  studentName: String,
  enrollmentno: String,
  branch: String,
  studentImage: String
});

const attendanceSchema = new mongoose.Schema({
  teacherEmail: String,
  branch: String,
  day: Number,
  month: Number,
  studentsPresent: [{
    type: String
  }]
});

teacherSchema.plugin(passportLocalMongoose);

const Teacher = mongoose.model("teacher", teacherSchema);
const Student = mongoose.model("student", studentSchema);
const UploadedImages = mongoose.model("uploadedimages", uploadedImagesSchema);
const Attendance = mongoose.model("attendance", attendanceSchema);

passport.use("teacher-local", new LocalStrategy(Teacher.authenticate()));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  if (user != null)
    done(null, user);
});

const sendResetPasswordMail = (name, email, token) => {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
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
      console.log(err);
    } else {
      console.log(info);
    }
  });
}

app.get("/", ensureGuestTeacher, function(req, res) {
  res.redirect("/teacherLogin");
});

app.get("/teacherLogin", ensureGuestTeacher, function(req, res) {
  res.render("teacherLogin");
});

app.post("/teacherLogin", passport.authenticate("teacher-local", {
  successRedirect: "/teacherHome",
  failureRedirect: "/teacherLogin",
  failureFlash: true
}));

app.get("/teacherRegister", ensureGuestTeacher, function(req, res) {
  res.render("teacherRegister");
});

app.post("/teacherRegister", function(req, res) {
  const email = req.body.username;
  const teacherName = req.body.teacherName;
  const collegeCode = req.body.collegeCode;
  let errors = [];
  if (/^[a-zA-Z ]+$/.test(req.body.teacherName) === false) {
    errors.push({
      msg: "Please enter correct name"
    });
  }
  if (errors.length > 0) {
    res.render("teacherRegister", {
      errors,
      teacherName,
      email,
      collegeCode
    });
  } else {
    if (req.body.password.length < 6) {
      errors.push({
        msg: "Password should be atleast 6 characters"
      });
    }
    if (errors.length > 0) {
      res.render("teacherRegister", {
        errors,
        teacherName,
        email,
        collegeCode
      });
    } else {
      if (req.body.collegeCode != college_code) {
        errors.push({
          msg: "Incorrect College Code"
        });
      }
      if (errors.length > 0) {
        res.render("teacherRegister", {
          errors,
          teacherName,
          email,
          collegeCode
        });
      } else {
        Teacher.register({
          username: req.body.username,
          teacherName: req.body.teacherName
        }, req.body.password, function(err, user) {
          if (err) {
            errors.push({
              msg: "Email is already registered"
            })
            res.render("teacherRegister", {
              errors,
              teacherName,
              email,
              collegeCode
            });
          } else {
            passport.authenticate("teacher-local")(req, res, function() {
              res.redirect("/teacherHome");
            });
          }
        });
      }
    }
  }
});

app.get("/forgotPassword", ensureGuestTeacher, function(req, res) {
  res.render("forgotPassword");
});

app.post("/forgotPassword", function(req, res) {
  const email = req.body.username;
  Teacher.findOne({
    username: email
  }, function(req, result) {
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
      Teacher.updateOne({
        username: email
      }, {
        $set: {
          token: randomstringVariable
        }
      }, function(err, teacherData) {
        sendResetPasswordMail(result.teacherName, result.username, randomstringVariable);
        res.render("forgotPassword", {
          success_msg: "Email Sent!"
        });
      });
    }
  });
});

app.get("/resetPassword", ensureGuestTeacher, function(req, res) {
  Teacher.findOne({
    token: req.query.token
  }, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (!result) {
        res.status(200).send({
          msg: "Invalid Link"
        });
      } else {
        res.render("resetPassword", {
          token: req.query.token
        });
      }
    }
  });
});

app.post("/resetPassword", function(req, res) {
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
      Teacher.findOne({
        token: req.body.token
      }, (err, user) => {
        user.setPassword(newPassword, function(err, users) {
          Teacher.updateOne({
              _id: users._id
            }, {
              hash: users.hash,
              salt: users.salt,
              token: ''
            },
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.render("teacherLogin", {
                  success_msg: "Password Changed Successfully!"
                })
              }
            })
        })
      })
    }
  }
});

app.get("/teacherHome", ensureAuthTeacher, function(req, res) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.render("teacherHome", {
    teacherName: req.user.teacherName,
    email: req.user.username
  });
});

app.post("/takemehome", function(req, res) {
  res.redirect("/teacherHome");
});

app.post("/markattendance", function(req, res) {
  res.redirect("uploadattendancescreenshot");
});

app.get("/uploadattendancescreenshot", ensureAuthTeacher, function(req, res) {
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

app.post("/uploadimages", function(req, res) {
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
    Attendance.findOne({
      teacherEmail: req.user.username,
      branch: req.body.branch,
      month: month,
      day: day
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
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
          cloudinary.uploader.upload(firstImage.tempFilePath, (err, result) => {
            const firstLink = result.url;
            const imageuploaded = new UploadedImages({
              email: req.user.username,
              firstImagePath: firstLink,
              branch: req.body.branch,
              day: day,
              month: month
            });
            imageuploaded.save(() => {
              res.redirect("/uploadAttendance");
            });
          });
        }
      }
    })
  }
});

app.get("/uploadAttendance", ensureAuthTeacher, function(req, res) {
  UploadedImages.find({
    email: req.user.username
  }, function(err, result) {
    const len = result.length;
    const branch = result[len - 1].branch;
    const day = result[len - 1].day;
    const month = result[len - 1].month;
    const studentNames = [];
    const imageLinks = [];
    const studentEnrollmentNo = [];
    Student.find({
      branch: branch
    }, function(err, studentData) {
      if (err) {
        console.log(err);
      } else {
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
    });
  });
});

app.post("/uploadAttendance", function(req, res) {
  const attendanceRecord = new Attendance({
    teacherEmail: req.user.username,
    branch: req.body.branch,
    day: req.body.day,
    month: req.body.month,
    studentsPresent: req.body.studentsWhoAttend.split(",")
  });
  attendanceRecord.save(() => {
    res.render("attendanceUploaded", {
      teacherName: req.body.teacherName,
      email: req.user.username,
      branch: req.body.branch,
      day: req.body.day,
      month: req.body.month
    });
  });
});

app.post("/viewAttendance", function(req, res) {
  Attendance.findOne({
    email: req.body.email,
    branch: req.body.branch,
    month: req.body.month,
    day: req.body.day
  }, function(err, result) {
    const studentNames = [];
    const studentEnrollmentNo = [];
    Student.find({
      branch: req.body.branch
    }, function(err, studentData) {
      if (err) {
        console.log(err);
      } else {
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
    });
  });
});

app.post("/viewmonthlyattendance", function(req, res) {
  res.redirect("/viewAttendanceofMonth");
});

app.get("/viewAttendanceofMonth", ensureAuthTeacher, function(req, res) {
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

app.post("/attendanceofmonth", function(req, res) {
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
      Attendance.find({
        email: req.user.username,
        month: months.indexOf(req.body.attendanceMonth) + 1,
        branch: req.body.branch
      }, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          const idx = months.indexOf(req.body.attendanceMonth);
          const noOfDays = daysInMonth[idx];
          Student.find({
            branch: req.body.branch
          }, function(err, studentData) {
            if (err) {
              console.log(err);
            } else {
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
              })
            }
          })
        }
      });
    }
  };
})

app.get("/teacherLogout", ensureAuthTeacher, function(req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    } else {
      req.flash("success_msg", "You are logged out");
      res.redirect("/teacherLogin");
    }
  });
});

function ensureAuthTeacher(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash("error_msg", "Please login to view this page");
    res.redirect("/teacherLogin");
  }
}

function ensureGuestTeacher(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/teacherHome");
  } else {
    return next();
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
  console.log(`The server is running on port ${PORT}.`);
});
